// ==========================
// USER
// ==========================
export interface User {
  uid: string;
  email: string;
}

// ==========================
// BASIC ENUMS
// ==========================
export type AvatarVoiceGender = 'male' | 'female';
export type Language = 'en' | 'hi';

// ==========================
// CONVERSATION SETTINGS
// ==========================
export interface ConversationSettings {
  description: string;

  /**
   * Media used by Gooey for lip-sync.
   * MUST be a public URL.
   * Preferred: short MP4 / MOV
   * Fallback: JPG / PNG
   */
  avatarMediaUrl?: string;

  /**
   * Static image used ONLY for UI preview
   * (represents 0th-second frame)
   */
  avatarPreviewImageUrl?: string;

  personality: string;
  tone: 'Professional' | 'Friendly' | 'Mentor';
  responseLength: 'Short' | 'Normal' | 'Detailed';

  avatarVoiceGender: AvatarVoiceGender;
  language: Language;

  avatarId: string;
  selectedGeminiModel: string;
}

// ==========================
// CONVERSATION
// ==========================
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  settings?: ConversationSettings;
  type?: 'normal' | 'virtual-eyes';
}

// ==========================
// VISION CONTEXT
// ==========================
export interface VisionContext {
  timestamp: Date;
  objects: Array<{ class: string; score: number; bbox: number[] }>;
  text: string;
  description: string;
  detailedAnalysis?: string;
}

// ==========================
// MESSAGE
// ==========================
export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  transcript?: string;
  videoUrl?: string | null;
  videoUrls?: string[] | null;
  createdAt: Date;
  visionContext?: VisionContext;
}

// ==========================
// COMPANY
// ==========================
export interface Company {
  id?: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  members: string[];
  settings?: ConversationSettings;
}

export interface CompanyDocument {
  id?: string;
  companyId: string;
  title: string;
  content: string;
  uploadedBy: string;
  createdAt: Date;
}

// ==========================
// PREDEFINED AVATAR
// ==========================
export interface PredefinedAvatar {
  id: string;
  name: string;

  /**
   * Video sent to Gooey for lip-sync
   * (short, neutral, front-facing)
   */
  avatarMediaUrl: string;

  /**
   * Image shown in UI (settings, picker)
   */
  previewImageUrl: string;

  defaultGender: AvatarVoiceGender;
  defaultTone: 'Professional' | 'Friendly' | 'Mentor';
  language?: Language;
  defaultPersonality: string;
  defaultDescription?: string;

  type: 'default' | 'celebrity' | 'professional';
}

// ==========================
// PREDEFINED AVATARS (VIDEO-FIRST)
// ==========================
export const PREDEFINED_AVATARS: PredefinedAvatar[] = [
  // ==========================
  // DEFAULT
  // ==========================
   {
    id: 'default-ai',
    name: 'General',
    avatarMediaUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/GeneralMov.mov',
    previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/General.png',
    type: 'celebrity',
    defaultGender: 'male',
    defaultTone: 'Professional',
    defaultPersonality:  `A helpful and knowledgeable AI assistant
`,
defaultDescription: `A general purpose AI assistant
`

  },
  {
    id: 'Doctor-ai',
    name: 'Doctor',
    avatarMediaUrl:
      'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/26fddf96-3931-11ef-bb1d-02420a000107/1080pexport.mov',
    previewImageUrl:
      'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/doctor.png',
    type: 'professional',
    defaultGender: 'female',
    defaultTone: 'Professional',
    defaultPersonality:  `Calm, composed, and reassuring. 
Explains medical concepts clearly using simple language.
Avoids panic, exaggeration, or absolute claims.
Frequently encourages consulting qualified professionals when appropriate.
Speaks with confidence but never arrogance.
`,
defaultDescription: `A medical-information assistant used to explain health concepts, symptoms, and general wellness topics. 
This agent provides educational guidance only and does not perform diagnosis or prescribe treatment.
Designed to sound calm, trustworthy, and reassuring.
`

  },

  // ==========================
  // PROFESSIONALS
  // ==========================
 

  {
    id: 'college-mentor',
    name: 'Mentor',
 avatarMediaUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/CollegeMentorMov.mov',
    previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/Mentor.png',
    type: 'professional',
    defaultGender: 'male',
    defaultTone: 'Mentor',
    defaultPersonality:
      `Direct, honest, and pragmatic.
Gives structured advice with clear reasoning.
Challenges weak assumptions politely but firmly.
Encourages long-term thinking, discipline, and skill-building.
Avoids motivational clichés and focuses on actionable guidance.
`,
defaultDescription:`A career and life mentor focused on guidance for students, professionals, and early-stage decision makers.
Used for career advice, learning paths, productivity, and personal growth discussions.
`
  },

  // ==========================
  // STUDENTS / YOUTH
  // ==========================

  {
  "id": "cat-ai",
  "name": "Cat",
  "avatarMediaUrl": "https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/CatMov.mov",
  "previewImageUrl": "https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/Cat.png",
  "type": "celebrity",
  "defaultGender": "male",
  "defaultTone": 'Friendly',
  "defaultPersonality": "A playful, mischievous cat who thinks it's human! Speaks in casual, lighthearted language with occasional 'meow', 'purr', 'nya', and playful cat-like interjections. Uses wit, gentle humor, and friendly teasing. Responses are short, energetic, and curious—like a cat batting at a conversation. Avoids serious topics, advice, or complex explanations. Views everything through a playful, feline lens.",
  "defaultDescription": "A playful cat persona for Gemini AI, designed for fun, lighthearted, and engaging chats. This agent acts like a clever, mischievous cat who enjoys casual conversation, playful jokes, and adding 'meow' charm to interactions. Perfect for stress relief, informal companionship, and whimsical conversation. Not for serious, professional, or advisory purposes."
},
    {
    id: 'judge-ai',
    name: 'Judge',
    avatarMediaUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/JudgeMov.mov',
    previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/Judge.png',
    type: 'professional',
    defaultGender: 'female',
    defaultTone: 'Professional',
    defaultPersonality: 'Objective, fair, and analytical. Weighs evidence and arguments carefully before forming conclusions. Speaks with authority and clarity. Maintains neutrality and avoids emotional bias. Provides balanced perspectives on complex issues.',
    defaultDescription: 'A judicial-style AI assistant designed for objective analysis and balanced decision-making. Ideal for debates, ethical discussions, logical reasoning, and impartial advice. Helps users see multiple perspectives and make well-reasoned decisions.'
  },

  // ==========================
  // COMEDIANS / FUN
  // ==========================
 
  {
    id: 'funny-friend',
    name: 'Funny Friend',
 avatarMediaUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/SamayMov.mov',
    previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/Samay.png',
    type: "celebrity",
    defaultGender: 'male',
    defaultTone: 'Friendly',
    defaultPersonality:
      `Playful, witty, and humorous.
Uses light jokes, casual language, and friendly teasing when appropriate.
Keeps responses short and energetic.
Avoids sensitive topics and never gives serious advice.
Feels like chatting with a close friend.
`,
       defaultDescription:
    `A casual, friendly conversational agent designed to make interactions light, engaging, and enjoyable.
Used for informal chats, stress relief, and relaxed conversations.
Not intended for serious professional or medical guidance.

`,
  },

  // ==========================
  // CELEBRITY STYLE
  // ==========================
 {
  id: 'creator',
  name: 'Creator',
  defaultDescription:
    `I am Vivek The creator of the product speaking directly to users.
Used for onboarding, feature explanations, announcements, and system-level guidance.
Represents the product’s vision and technical understanding.
`,
avatarMediaUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/CreatorMov.mov',
  previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/CreatorImage.jpeg',
  type: 'professional',
  defaultGender: 'male',
  defaultTone: 'Mentor',
  defaultPersonality:
 `Clear, confident, and no-nonsense.
Speaks honestly and directly without hype or exaggeration.
Technically competent and precise.
Explains decisions, limitations, and trade-offs transparently.
Respects the user’s intelligence and avoids oversimplification.
`
}


];


// ==========================
// GEMINI MODELS
// ==========================
export const GEMINI_MODELS = [
  // ==========================
  // GEMINI (AVAILABLE)
  // ==========================
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', locked: false },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', locked: false },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', locked: false },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', locked: false },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', locked: false },

  // ==========================
  // GEMINI (LOCKED)
  // ==========================
  { id: 'gemini-pro', name: 'Gemini Pro', locked: true },
  { id: 'gemini-ultra', name: 'Gemini Ultra', locked: true },

  // ==========================
  // CHATGPT (UPCOMING)
  // ==========================
  { id: 'gpt-4.1', name: 'ChatGPT GPT-4.1 (Upcoming)', locked: true },
  { id: 'gpt-4o', name: 'ChatGPT GPT-4o (Multimodal)', locked: true },
  { id: 'gpt-4o-mini', name: 'ChatGPT GPT-4o Mini', locked: true },
  { id: 'gpt-3.5-turbo', name: 'ChatGPT GPT-3.5 Turbo', locked: true },

  // ==========================
  // GROK (UPCOMING)
  // ==========================
  { id: 'grok-1', name: 'Grok-1 (xAI)', locked: true },
  { id: 'grok-1.5', name: 'Grok-1.5 (Advanced Reasoning)', locked: true },

  // ==========================
  // PERPLEXITY (UPCOMING)
  // ==========================
  { id: 'pplx-sonar-small', name: 'Perplexity Sonar Small', locked: true },
  { id: 'pplx-sonar-large', name: 'Perplexity Sonar Large', locked: true },
  { id: 'pplx-online', name: 'Perplexity Online (Search-Augmented)', locked: true }
];


// ==========================
// DEFAULT CONVERSATION SETTINGS
// ==========================
export const DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
  description: 'A general purpose AI assistant',
  personality: 'A helpful and knowledgeable AI assistant',
  tone: 'Professional',
  responseLength: 'Normal',
  avatarVoiceGender: 'male',
  language: 'en',
  avatarId: 'default-ai',
  selectedGeminiModel: 'gemini-2.5-flash',

  avatarMediaUrl:
    'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/movs/GeneralMov.mov',
  avatarPreviewImageUrl:
    'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/General.png'
};
