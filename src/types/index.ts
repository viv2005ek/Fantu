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
}

// ==========================
// MESSAGE
// ==========================
export interface Message {
  id?: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;

  /**
   * Final Gooey-generated talking video URL
   */
  videoUrl?: string;

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
    avatarMediaUrl:
      'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/26fddf96-3931-11ef-bb1d-02420a000107/1080pexport.mov',
    previewImageUrl:
      'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg',
    type: 'default',
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
    avatarMediaUrl:
      'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/26fddf96-3931-11ef-bb1d-02420a000107/1080pexport.mov',
    previewImageUrl:
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
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



  // ==========================
  // COMEDIANS / FUN
  // ==========================
 
  {
    id: 'funny-friend',
    name: 'Funny Friend',
    avatarMediaUrl:
      'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/26fddf96-3931-11ef-bb1d-02420a000107/1080pexport.mov',
    previewImageUrl:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    type: 'default',
    defaultGender: 'male',
    defaultTone: 'Friendly',
    defaultPersonality:
      `Playful, witty, and humorous.
Uses light jokes, casual language, and friendly teasing when appropriate.
Keeps responses short and energetic.
Avoids sensitive topics and never gives serious advice.
Feels like chatting with a close friend.
`,
      language: 'hi',
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
  previewImageUrl: 'https://cdn.jsdelivr.net/gh/viv2005ek/fantu-avatars@master/images/CreatorPhoto.jpeg',
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
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', locked: false },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', locked: false },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', locked: false },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', locked: false },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', locked: false },
  { id: 'gemini-pro', name: 'Gemini Pro', locked: true },
  { id: 'gemini-ultra', name: 'Gemini Ultra', locked: true }
];

// ==========================
// DEFAULT CONVERSATION SETTINGS
// ==========================
export const DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
  description: 'A general purpose AI assistant',
  personality: 'A helpful and knowledgeable AI assistant',
  tone: 'Professional',
  responseLength: 'Normal',
  avatarVoiceGender: 'female',
  language: 'en',
  avatarId: 'default-ai',
  selectedGeminiModel: 'gemini-2.5-flash',

  avatarMediaUrl:
    'https://storage.googleapis.com/dara-c1b52.appspot.com/daras_ai/media/26fddf96-3931-11ef-bb1d-02420a000107/1080pexport.mov',
  avatarPreviewImageUrl:
    'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg'
};
