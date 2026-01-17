import { Language } from '../types';

const GOOEY_SERVER_URL = import.meta.env.VITE_GOOEY_SERVER_URL || 'http://localhost:3001';

export interface GooeyVideoRequest {
  text: string;
  language: Language;
  avatarUrl?: string;
  gender?: 'male' | 'female';
}

export interface GooeyVideoResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
  fallback?: boolean;
}

export async function generateAvatarVideo(request: GooeyVideoRequest): Promise<GooeyVideoResponse> {
  try {
    const apiUrl = `${GOOEY_SERVER_URL}/api/generate-avatar-video`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
     body: JSON.stringify({
  text: request.text,
  language: request.language,
  avatarUrl: request.avatarUrl,
  gender: request.gender
})

    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Gooey server error:', data);
      return {
        success: false,
        error: data.error || 'Failed to generate video',
        fallback: true
      };
    }

    return {
      success: true,
      videoUrl: data.videoUrl
    };
  } catch (error) {
    console.error('Failed to call Gooey server:', error);
    return {
      success: false,
      error: 'Failed to connect to video server',
      fallback: true
    };
  }
}

export async function checkGooeyHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${GOOEY_SERVER_URL}/api/health`);
    const data = await response.json();
    return data.status === 'ok' && data.gooeyApiKeyConfigured;
  } catch {
    return false;
  }
}
