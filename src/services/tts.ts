export type Tone = 'Professional' | 'Friendly' | 'Mentor';

interface VoiceSettings {
  rate: number;
  pitch: number;
}

const TONE_SETTINGS: Record<Tone, VoiceSettings> = {
  Professional: { rate: 1.0, pitch: 1.0 },
  Friendly: { rate: 1.05, pitch: 1.1 },
  Mentor: { rate: 0.9, pitch: 0.95 }
};

let selectedVoice: SpeechSynthesisVoice | null = null;

function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (selectedVoice) return selectedVoice;

  const voices = window.speechSynthesis.getVoices();
  selectedVoice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                  voices.find(v => v.lang.startsWith('en')) ||
                  voices[0] || null;

  return selectedVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    selectedVoice = null;
    getEnglishVoice();
  };
}

export function speakText(
  text: string,
  tone: Tone = 'Professional',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      onEnd?.();
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const settings = TONE_SETTINGS[tone];

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 1;

    const voice = getEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      onEnd?.();
      if (event.error === 'canceled' || event.error === 'interrupted') {
        resolve();
      } else {
        reject(new Error(event.error));
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking || false;
}
