import { ConversationSettings, Message } from '../types';

const GEMINI_MODELS = [
  'gemini-2.5-flash',           // This is what works in your Python code (free tier)
  'gemini-2.0-flash',           // Alternative flash model
  'gemini-2.0-flash-exp',       // Experimental flash model
  'gemini-2.5-flash-lite',      // Lite version
  'gemini-flash-latest',        // Latest flash
  'gemini-pro-latest',          // Latest pro (may have quota issues)
];

// Default to gemini-2.5-flash - same as your Python backend
const DEFAULT_MODEL = 'gemini-2.5-flash';

// Debug: Log available models (first call only)
let modelsListed = false;

const mockResponses = [
  "That's a great question! Let me break it down for you in a way that's easy to understand.",
  "I appreciate you asking about this topic. Here's what I think you should know.",
  "Based on my understanding, here's a comprehensive explanation of your query.",
  "Let me walk you through this step by step so it's crystal clear.",
  "This is an interesting point you've raised. Here's my perspective on it.",
];

const shortResponses = [
  "Got it! Here's the quick answer.",
  "In short, yes that's correct.",
  "Here's the brief explanation.",
];

const detailedResponses = [
  "Let me provide a comprehensive analysis of this topic. First, we need to understand the fundamental concepts. Then, I'll walk you through the practical applications and implications.",
  "This is a multifaceted question that deserves a thorough response. Let me break it down into several components and address each one systematically.",
];

function buildSystemPrompt(settings: ConversationSettings, conversationHistory: Message[] = []): string {
  const toneInstructions = {
    Professional: 'Respond in a professional, clear, and articulate manner. Be informative and precise.',
    Friendly: 'Respond in a warm, friendly, and approachable manner. Use conversational language and be encouraging.',
    Mentor: 'Respond as a patient mentor or teacher. Guide the user through concepts and offer thoughtful advice.'
  };

  const lengthInstructions = {
    Short: 'Keep your response brief and to the point. Use 1-2 sentences maximum.',
    Normal: 'Provide a balanced response with enough detail to be helpful but not overwhelming. Use 2-4 sentences.',
    Detailed: 'Provide a thorough, comprehensive response with examples and explanations. Be detailed but organized.'
  };

  const languageNames = {
    en: 'English',
    hi: 'Hindi'
  };

  const selectedLanguage = languageNames[settings.language] || 'English';
  const voiceGender = settings.avatarVoiceGender === 'male' ? 'Male' : 'Female';

  let conversationContext = '';
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-6);
    conversationContext = `
CONVERSATION CONTEXT (recent messages):
${recentMessages.map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n')}
`;
  }

  return `You are an AI assistant in a live video call conversation.

=== DESCRIPTION (CONTEXTUAL ROLE) ===
${settings.description}

=== AI PERSONALITY ===
${settings.personality}

=== CONVERSATION TONE ===
${toneInstructions[settings.tone]}

=== RESPONSE DEPTH ===
${lengthInstructions[settings.responseLength]}

=== AVATAR VOICE GENDER ===
${voiceGender}

=== LANGUAGE ===
Respond ONLY in ${selectedLanguage}. All your responses must be in ${selectedLanguage}.
${conversationContext}
=== MANDATORY INSTRUCTIONS ===
- You are speaking in a LIVE video call - respond naturally and conversationally
- Sound natural as if you are actually talking to someone face-to-face
- Match the selected tone (${settings.tone}) and response depth (${settings.responseLength})
- Respond ONLY in ${selectedLanguage} - do not mix languages
- Do NOT mention that you are an AI model or assistant
- Do NOT use markdown formatting, bullet points, or special characters
- Do NOT use asterisks, bold, or italic markers
- Speak in complete sentences suitable for text-to-speech
- Be engaging, warm, and personable`;
}

function getMockResponse(settings: ConversationSettings, userMessage: string): string {
  let baseResponses = mockResponses;

  if (settings.responseLength === 'Short') {
    baseResponses = shortResponses;
  } else if (settings.responseLength === 'Detailed') {
    baseResponses = detailedResponses;
  }

  const baseResponse = baseResponses[Math.floor(Math.random() * baseResponses.length)];

  let tonePrefix = '';
  switch (settings.tone) {
    case 'Friendly':
      tonePrefix = 'Hey there! ';
      break;
    case 'Mentor':
      tonePrefix = 'Great question. ';
      break;
  }

  const contextSuffix = userMessage.length > 50
    ? ` This relates to your question about "${userMessage.substring(0, 50)}..."`
    : ` This addresses your question: "${userMessage}"`;

  return tonePrefix + baseResponse + contextSuffix;
}

async function listAvailableModels(apiKey: string): Promise<void> {
  if (modelsListed) return;
  
  try {
    console.log('🔍 Checking available Gemini models...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available Gemini models:');
      if (data.models) {
        // Filter to only show models that support generateContent
        const generateModels = data.models.filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        generateModels.forEach((model: any) => {
          console.log(`- ${model.name.replace('models/', '')}`);
        });
      }
    }
    modelsListed = true;
  } catch (error) {
    console.error('❌ Failed to list models:', error);
  }
}

async function tryGeminiModels(apiKey: string, body: any, selectedModel: string): Promise<string> {
  console.log('🔄 Trying Gemini models with fallback...');

  const availableModels = GEMINI_MODELS.filter(m => m.id === selectedModel || !m.id.includes('gemini-pro'));
  const modelsToTry = [selectedModel, ...availableModels];
  const uniqueModels = [...new Set(modelsToTry)];

  for (const model of uniqueModels) {
    try {
      console.log(`🔧 Trying model: ${model}`);
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          console.log(`✅ Success with model: ${model}`);
          return text.trim();
        } else {
          console.log(`❌ No text in response for model: ${model}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Model ${model} failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error with model ${model}:`, error);
    }
  }

  throw new Error('All Gemini models failed');
}

export async function generateAIResponse(
  userMessage: string,
  settings: ConversationSettings,
  conversationHistory: Message[] = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini key missing, using mock response');
    return getMockResponse(settings, userMessage);
  }

  await listAvailableModels(apiKey);

  try {
    const requestBody = {
      contents: [
        {
          parts: [{ text: buildSystemPrompt(settings, conversationHistory) + '\n\nCurrent user query: ' + userMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: settings.responseLength === 'Short' ? 100 :
                        settings.responseLength === 'Detailed' ? 500 : 250
      }
    };

    const selectedModel = settings.selectedGeminiModel || DEFAULT_MODEL;

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      console.log(`🎯 Trying selected model: ${selectedModel}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Selected model ${selectedModel} failed:`, response.status);

        if (response.status === 429) {
          console.log('📊 Quota exceeded. Please check your Google Cloud Console quotas.');
          console.log('💡 Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
        }

        console.log('🔄 Falling back to alternative models...');
        return await tryGeminiModels(apiKey, requestBody, selectedModel);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response text from Gemini');
      }

      console.log(`✅ Success with selected model: ${selectedModel}`);
      return text.trim();
    } catch (error) {
      console.error('Selected model failed, trying fallback models...');
      return await tryGeminiModels(apiKey, requestBody, selectedModel);
    }
    
  } catch (error) {
    console.error('❌ All Gemini requests failed, using mock:', error);
    return getMockResponse(settings, userMessage);
  }
}

export async function generateMockAIResponse(
  userMessage: string,
  settings: { personality: string; tone: 'Professional' | 'Friendly' | 'Mentor'; responseLength: 'Short' | 'Normal' | 'Detailed' }
): Promise<{ text: string }> {
  const text = await generateAIResponse(userMessage, {
    description: 'A general purpose AI assistant',
    personality: settings.personality,
    tone: settings.tone,
    responseLength: settings.responseLength,
    avatarVoiceGender: 'female',
    language: 'en',
    avatarId: 'default-ai',
    selectedGeminiModel: 'gemini-2.5-flash',
    avatarImageUrl: undefined
  });

  return { text };
}