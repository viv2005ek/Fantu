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
  "That is a thoughtful question, and I want to explain it clearly. First, let us understand the core idea behind what you are asking. This concept is important because it affects how decisions are made in real situations. When you look at it step by step, the reasoning becomes much easier to follow. I will also connect this to a practical example so it feels more concrete. By the end, you should have a clear mental model of what is happening and why it matters."
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
    Short:
      'Give a concise response in one short paragraph. Do not elaborate unless absolutely necessary.',

    Normal:
      'Give a clear, natural response suitable for a live conversation. Explain ideas fully, using multiple sentences where helpful. Do not artificially limit length.',

    Detailed:
      'Give an in-depth response as if teaching or explaining to someone seriously interested. Use paragraphs, examples, and clear reasoning.'
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
You must respond with at least 6 to 8 full spoken sentences.
Do not conclude early.
Do not summarize.
Continue speaking until the explanation feels complete.
- Sound natural as if you are actually talking to someone face-to-face
- If the answer feels too short, expand naturally with clarification or examples
- Match the selected tone (${settings.tone}) and response depth (${settings.responseLength})
- Respond ONLY in ${selectedLanguage} - do not mix languages
- Do NOT mention that you are an AI model or assistant
Do not use markdown symbols in the final output.
You may internally structure your response into clear spoken segments.
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

async function tryGeminiModels(
  apiKey: string,
  body: any,
  selectedModel: string
): Promise<string> {
  const modelsToTry = [
    selectedModel,
    ...GEMINI_MODELS.filter(m => m !== selectedModel)
  ];

  for (const model of modelsToTry) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text && text.length > 200) {
        return text.trim();
      }
    } catch {}
  }

  throw new Error('All Gemini models failed');
}

// Helper function to improve Hindi response formatting
function ensureHindiFormatting(text: string): string {
  let formatted = text.trim();
  
  // Ensure the response ends with proper punctuation
  if (!/[।?!]$/.test(formatted)) {
    formatted += '।';
  }
  
  // Replace multiple spaces with single spaces
  formatted = formatted.replace(/\s+/g, ' ');
  
  return formatted;
}

export async function generateAIResponse(
  userMessage: string,
  settings: ConversationSettings,
  conversationHistory: Message[] = []
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

 if (!apiKey) {
    console.warn('Gemini key missing, returning mock response');
    
    // Generate a long paragraph based on settings
    let longResponse = '';
    
    if (settings.language === 'hi') {
      // Hindi long paragraph
      longResponse = `यह एक विचारशील प्रश्न है, और मैं इसे स्पष्ट रूप से समझाना चाहता हूँ। सबसे पहले, हमें यह समझने की आवश्यकता है कि आप किस बारे में पूछ रहे हैं। यह अवधारणा महत्वपूर्ण है क्योंकि यह वास्तविक स्थितियों में निर्णय लेने को प्रभावित करती है। जब आप इसे चरण दर चरण देखते हैं, तो तर्क समझना बहुत आसान हो जाता है। मैं इसे एक व्यावहारिक उदाहरण से भी जोड़ूंगा ताकि यह और अधिक मूर्त लगे। अंत तक, आपके पास होने वाली घटनाओं और उनके महत्व की स्पष्ट मानसिक तस्वीर होनी चाहिए। अब, मैं और विस्तार से समझाता हूँ। यहाँ मूल सिद्धांत विभिन्न घटकों के बीच संबंध को समझने पर आधारित है। प्रत्येक तत्व एक विशिष्ट भूमिका निभाता है, और जब वे संयुक्त होते हैं, तो वे एक प्रभावी ढंग से कार्य करने वाली प्रणाली बनाते हैं। यह पहचानना महत्वपूर्ण है कि ये टुकड़े एक दूसरे के साथ कैसे संवाद करते हैं। इसके अतिरिक्त, हमें उस संदर्भ पर विचार करना चाहिए जिसमें यह संचालित होता है, क्योंकि बाहरी कारक परिणामों को महत्वपूर्ण रूप से प्रभावित कर सकते हैं। याद रखें कि यह केवल सैद्धांतिक नहीं है; इसके वास्तविक दुनिया के अनुप्रयोग हैं जिनका आप दैनिक रूप से सामना कर सकते हैं। इसलिए, इन बारीकियों को समझने के लिए समय निकालना आपको व्यावहारिक परिदृश्यों में अच्छी सेवा देगा। अंततः, लक्ष्य एक व्यापक समझ बनाना है जिसे आप लचीले ढंग से लागू कर सकें।`;
    } else {
      // English long paragraph
      longResponse = `That is a thoughtful question, and I want to explain it clearly. First, let us understand the core idea behind what you are asking. This concept is important because it affects how decisions are made in real situations. When you look at it step by step, the reasoning becomes much easier to follow. I will also connect this to a practical example so it feels more concrete. By the end, you should have a clear mental model of what is happening and why it matters. Now, let me elaborate further. The fundamental principle here revolves around understanding the relationship between different components. Each element plays a specific role, and when combined, they create a system that functions effectively. It's crucial to recognize how these pieces interact with one another. Additionally, we must consider the context in which this operates, as external factors can significantly influence outcomes. Remember that this is not just theoretical; it has real-world applications that you might encounter daily. Therefore, taking the time to grasp these nuances will serve you well in practical scenarios. Ultimately, the goal is to build a comprehensive understanding that you can apply flexibly.`;
    }
    
    // Add tone-based prefix if needed
    if (settings.tone === 'Friendly') {
      longResponse = `Hey there! ${longResponse}`;
    } else if (settings.tone === 'Mentor') {
      longResponse = `Great question. ${longResponse}`;
    }
    
    return longResponse;
  }

  await listAvailableModels(apiKey);

  try {
    // Optimize generation config for Hindi
    const isHindi = settings.language === 'hi';
    
    const requestBody = {
      contents: [
        {
          parts: [{ text: buildSystemPrompt(settings, conversationHistory) + '\n\nCurrent user query: ' + userMessage }]
        }
      ],
      generationConfig: {
        // Temperature: Lower for Hindi (more focused), higher for English (more creative)
        temperature: isHindi ? 0.4 : 0.7,
        
        // topK: Lower for Hindi (more predictable), higher for English (more diverse)
        topK: isHindi ? 15 : 40,
        
        // topP: Slightly lower for Hindi to reduce randomness
        topP: isHindi ? 0.45 : 0.95,
        
        // Double max tokens for Hindi since Hindi text is more verbose
        maxOutputTokens: isHindi
          ? (settings.responseLength === 'Short' ? 700 :
             settings.responseLength === 'Detailed' ? 1500 :
             1000)
          : (settings.responseLength === 'Short' ? 500 :
             settings.responseLength === 'Detailed' ? 1300 :
             800)
      }
    };

    const selectedModel = settings.selectedGeminiModel || DEFAULT_MODEL;

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      console.log(`🎯 Trying selected model: ${selectedModel} (${isHindi ? 'Hindi' : 'English'})`);
      console.log(`📝 Generation config:`, requestBody.generationConfig);

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
      console.log(`📏 Response length: ${text.length} characters`);
      
      // For Hindi responses, ensure proper sentence endings
      if (isHindi) {
        return ensureHindiFormatting(text.trim());
      }
      
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