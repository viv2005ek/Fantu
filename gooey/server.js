require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    port: PORT,
    gooeyApiKeyConfigured: !!GOOEY_API_KEY
  });
});

app.post('/api/generate-avatar-video', async (req, res) => {
  console.log('Received request to /api/generate-avatar-video');

  try {
const { text, language = 'en', gender = 'male', avatarMediaUrl  } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    if (!GOOEY_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: GOOEY_API_KEY not set'
      });
    }

    console.log(`Processing text: "${text.substring(0, 50)}..."`);

    // ---- Google TTS Voice Mapping ----
    let googleVoiceName;

    if (language === 'hi') {
      googleVoiceName = gender === 'male'
        ? 'hi-IN-Wavenet-B'
        : 'hi-IN-Wavenet-A';
    } else {
      googleVoiceName = gender === 'male'
        ? 'en-IN-Wavenet-C'
        : 'en-IN-Wavenet-A';
    }

    const payload = {
      text_prompt: text,

      // ✅ Use Google TTS
tts_provider: 'GOOGLE_TTS',
      google_voice_name: googleVoiceName,
      google_speaking_rate: 1.0,

      // ✅ Lip-sync model
      selected_model: 'Wav2Lip',

      // Optional face crop tuning
      face_padding_top: 3,
      face_padding_bottom: 16,
      face_padding_left: 12,
      face_padding_right: 6,
      input_face: avatarUrl
      // MUST be a public HTTPS image URL


    };

    console.log('Calling Gooey LipsyncTTS API...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(GOOEY_LIPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + GOOEY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Gooey response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gooey API error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: 'Gooey API request failed',
        details: errorText
      });
    }

    const result = await response.json();
    console.log('Gooey response:', JSON.stringify(result, null, 2));

    const videoUrl = result?.output?.output_video;

    if (!videoUrl) {
      return res.status(500).json({
        success: false,
        error: 'No output_video returned by Gooey',
        details: result
      });
    }

    return res.json({
      success: true,
      videoUrl
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
