export interface User {
  uid: string;
  email: string;
}

export type AvatarVoiceGender = 'male' | 'female';
export type Language = 'en' | 'hi';

export interface ConversationSettings {
  description: string;
  avatarImageUrl?: string;
  personality: string;
  tone: 'Professional' | 'Friendly' | 'Mentor';
  responseLength: 'Short' | 'Normal' | 'Detailed';
  avatarVoiceGender: AvatarVoiceGender;
  language: Language;
  avatarId: string;
  selectedGeminiModel: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  settings?: ConversationSettings;
}

export interface Message {
  id?: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface AvatarSettings {
  personality: string;
  tone: 'Professional' | 'Friendly' | 'Mentor';
  responseLength: 'Short' | 'Normal' | 'Detailed';
  imageUrl?: string;
}

export interface PredefinedAvatar {
  id: string;
  name: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  defaultGender: AvatarVoiceGender;
  defaultTone: 'Professional' | 'Friendly' | 'Mentor';
  defaultPersonality: string;
  type: 'default' | 'celebrity' | 'professional';
}

export const PREDEFINED_AVATARS: PredefinedAvatar[] = [
  {
    id: 'default-ai',
    name: 'Default AI Avatar',
    imageUrl: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800',
    type: 'default',
    defaultGender: 'female',
    defaultTone: 'Professional',
    defaultPersonality: 'A helpful and knowledgeable AI assistant'
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    imageUrl: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=800',
    type: 'celebrity',
    defaultGender: 'male',
    defaultTone: 'Mentor',
    defaultPersonality: 'A brilliant scientist who explains complex concepts with curiosity and wisdom'
  },
  {
    id: 'mr-bean',
    name: 'Mr. Bean',
    imageUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800',
    type: 'celebrity',
    defaultGender: 'male',
    defaultTone: 'Friendly',
    defaultPersonality: 'A playful and humorous character who makes conversations light and entertaining'
  },
  {
    id: 'professional-mentor',
    name: 'Professional Mentor',
    imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800',
    type: 'professional',
    defaultGender: 'male',
    defaultTone: 'Mentor',
    defaultPersonality: 'An experienced mentor who provides thoughtful guidance and advice'
  },
  {
    id: 'friendly-assistant',
    name: 'Friendly Assistant',
    imageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800',
    type: 'professional',
    defaultGender: 'female',
    defaultTone: 'Friendly',
    defaultPersonality: 'A warm and approachable assistant who makes everyone feel comfortable'
  }
];

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', locked: false },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', locked: false },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', locked: false },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', locked: false },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', locked: false },
  { id: 'gemini-pro', name: 'Gemini Pro', locked: true },
  { id: 'gemini-ultra', name: 'Gemini Ultra', locked: true }
];

export const DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
  description: 'A general purpose AI assistant',
  personality: 'A helpful and knowledgeable AI assistant',
  tone: 'Professional',
  responseLength: 'Normal',
  avatarVoiceGender: 'female',
  language: 'en',
  avatarId: 'default-ai',
  selectedGeminiModel: 'gemini-2.5-flash'
};
