require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Remove duplicate express.json() middleware - keep only one
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

const GOOEY_API_KEY = process.env.GOOEY_API_KEY;
if (!GOOEY_API_KEY) {
  console.error('ERROR: GOOEY_API_KEY is not set in environment variables!');
}

const GOOEY_LIPSYNC_ENDPOINT = 'https://api.gooey.ai/v2/LipsyncTTS/';

const DEFAULT_FACE_URL = 'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/ec9dab26-7479-11ef-bf69-02420a0001c7/ai%20generated%208434149_1280.jpg';

// Import https module
const https = require('https');

const DUMMY_VIDEO_URLS_EN = [
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/7f0df08e-f3e5-11f0-98f2-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/88ace726-f3e5-11f0-8975-02420a000185/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/9609d550-f3e5-11f0-aefc-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/9e16bc18-f3e5-11f0-9437-02420a000185/gooey.ai%20lipsync.mp4'
];

const DUMMY_VIDEO_URLS_HI = [
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/2cc76fde-f44f-11f0-9968-02420a000185/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/38730e10-f44f-11f0-a408-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/407ccdda-f44f-11f0-82dd-02420a000185/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/47daf890-f44f-11f0-8b74-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/4e7e8e5a-f44f-11f0-839f-02420a000185/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/55c19220-f44f-11f0-b8f9-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/5d37f846-f44f-11f0-8575-02420a00019c/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/646f8962-f44f-11f0-82a4-02420a000185/gooey.ai%20lipsync.mp4',
  'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/6b9dc01e-f44f-11f0-92fe-02420a00019c/gooey.ai%20lipsync.mp4'
];
// Add timeout function (place this BEFORE your route handlers)
function fetchWithTimeout(url, options, timeout = 60000) { // 60 seconds
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal,
      agent: new https.Agent({
        keepAlive: true,
        timeout: timeout
      })
    })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    port: PORT,
    gooeyApiKeyConfigured: !!GOOEY_API_KEY
  });
});
// Helper function to truncate text based on language
function truncateTextForVideo(text, language) {
  const maxChars = language === 'hi' ? 500 : 500; // Hindi: 700 chars, English: 500 chars
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // Find a good truncation point (end of sentence or space)
  let truncated = text.substring(0, maxChars);
  
  // Try to end at a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');
  
  const sentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
  
  if (sentenceEnd > maxChars * 0.7) { // Only if we find a sentence end in the last 30%
    truncated = truncated.substring(0, sentenceEnd + 1);
  } else {
    // Otherwise end at a word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.8) { // Only if we find a space in the last 20%
      truncated = truncated.substring(0, lastSpace);
    }
  }
  
  console.log(`Text truncated from ${text.length} to ${truncated.length} characters for ${language} language`);
  return truncated;
}
app.post('/api/generate-avatar-video', async (req, res) => {
  console.log('Received request to /api/generate-avatar-video');

  try {
    const { text, language = 'en', gender = 'male', avatarUrl } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

if (!GOOEY_API_KEY) {
  console.log('API key not configured, returning demo videos');
  console.log(`Processing text: "${text.substring(0, 50)}..."`);
  console.log(`Original text length: ${text.length} characters, Language: ${language}`);
  
  // Select the appropriate dummy URLs based on language
  const dummyUrls = language === 'hi' ? DUMMY_VIDEO_URLS_HI : DUMMY_VIDEO_URLS_EN;
  
  // Return the dummy URLs immediately
  return res.json({
    success: true,
    videoUrls: dummyUrls,
    totalChunks: dummyUrls.length,
    message: `Demo mode: Using ${language === 'hi' ? 'Hindi' : 'English'} sample video URLs (API key not configured)`,
    isDemo: true
  });
}

    console.log(`Processing text: "${text.substring(0, 50)}..."`);
    console.log(`Original text length: ${text.length} characters, Language: ${language}`);

// ---- Apply character limit ----
const processedText = truncateTextForVideo(text, language);

// Ensure sentence completion
let finalText = processedText.trim();
if (language === 'hi') {
  if (!/[।?!]$/.test(finalText)) {
    finalText += '।';
  }
} else {
  if (!/[.!?]$/.test(finalText)) {
    finalText += '.';
  }
}

console.log(`Final text length after processing: ${finalText.length} characters`);

    // ---- Split text into chunks ----
const words = finalText.split(' ');
const chunkSize = language === 'hi' ? 25 : 25; // Slightly smaller chunks for Hindi
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    console.log(`Split text into ${chunks.length} chunks`);

    // ---- Google TTS Voice Mapping ----
    let googleVoiceName;

    if (language === 'hi') {
      googleVoiceName = gender === 'male'
        ? 'hi-IN-Wavenet-B'
        : 'hi-IN-Wavenet-A';
    } else {
      googleVoiceName = gender === 'male'
        ? 'en-IN-Wavenet-C'
        : 'en-IN-Wavenet-D';
    }

    // ---- Generate videos for each chunk ----
    const videoUrls = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
      
      const payload = {
        text_prompt: chunk,
        tts_provider: 'GOOGLE_TTS',
        google_voice_name: googleVoiceName,
        google_speaking_rate: 1.0,
        selected_model: 'Wav2Lip',
        face_padding_top: 3,
        face_padding_bottom: 16,
        face_padding_left: 12,
        face_padding_right: 6,
        input_face: avatarUrl || DEFAULT_FACE_URL
      };

      // USE fetchWithTimeout HERE (inside the loop)
      const response = await fetchWithTimeout(GOOEY_LIPSYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'bearer ' + GOOEY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }, 600000); // 60 seconds timeout

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gooey API error for chunk ${i + 1}:`, response.status, errorText);
        throw new Error(`Failed to generate chunk ${i + 1}: ${errorText}`);
      }

      const result = await response.json();
      const videoUrl = result?.output?.output_video;
      
      if (!videoUrl) {
        throw new Error(`No output_video returned for chunk ${i + 1}`);
      }
      
      videoUrls.push(videoUrl);
      console.log(`Generated chunk ${i + 1}: ${videoUrl}`);
    }

    console.log(`Successfully generated ${videoUrls.length} video chunks`);

    return res.json({
      success: true,
      videoUrls,
      totalChunks: videoUrls.length,
      message: `Generated ${videoUrls.length} video chunks. You need to concatenate them client-side.`
    });

  } catch (error) {
    console.error('Error in /api/generate-avatar-video:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================`);
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Gooey API Key configured: ${!!GOOEY_API_KEY}`);
  console.log(`=======================================`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});