import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conversation, Message, ConversationSettings, DEFAULT_CONVERSATION_SETTINGS } from '../types';



export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      title: doc.data().title,
      createdAt: doc.data().createdAt.toDate(),
      settings: doc.data().settings || DEFAULT_CONVERSATION_SETTINGS
    }));
    callback(conversations);
  });
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const docRef = doc(db, 'conversations', conversationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    createdAt: data.createdAt.toDate(),
    settings: data.settings || DEFAULT_CONVERSATION_SETTINGS
  };
}

export function subscribeToConversation(
  conversationId: string,
  callback: (conversation: Conversation | null) => void
): () => void {
  const docRef = doc(db, 'conversations', conversationId);

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt.toDate(),
      settings: data.settings || DEFAULT_CONVERSATION_SETTINGS
    });
  });
}


export async function deleteConversation(conversationId: string): Promise<void> {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  await deleteDoc(doc(db, 'conversations', conversationId));
}

// Update addMessage function
export async function addMessage(message: Omit<Message, 'id'>): Promise<string> {
  const messagesRef = collection(db, 'messages');
  
  console.log('📝 Saving message to Firestore:', {
    text: message.text.substring(0, 50) + '...',
    videoUrls: message.videoUrls,
    sender: message.sender,
    videoUrlsCount: message.videoUrls?.length || 0
  });
  
  const docRef = await addDoc(messagesRef, {
    conversationId: message.conversationId,
    sender: message.sender,
    text: message.text,
    videoUrls: message.videoUrls || null, // Store as array or null
    createdAt: Timestamp.now()
  });
  
  console.log('✅ Message saved with ID:', docRef.id);
  return docRef.id;
}

// Update subscribeToMessages function
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle both old and new data formats
      let videoUrls: string[] | null = null;
      
      if (Array.isArray(data.videoUrls)) {
        videoUrls = data.videoUrls;
      } else if (data.videoUrl) {
        // Convert single videoUrl to array for consistency
        videoUrls = [data.videoUrl];
      } else if (data.videoUrls && !Array.isArray(data.videoUrls)) {
        // Handle case where videoUrls exists but isn't an array
        videoUrls = [data.videoUrls];
      }
      
      return {
        id: doc.id,
        conversationId: data.conversationId,
        sender: data.sender,
        text: data.text,
        videoUrls: videoUrls,
        createdAt: data.createdAt.toDate()
      };
    });
    
    console.log('📥 Messages loaded from Firestore:', {
      count: messages.length,
      hasVideoUrls: messages.filter(m => m.videoUrls && m.videoUrls.length > 0).length
    });
    
    callback(messages);
  });
}

// Update updateConversationSettings function with better defaults
export async function updateConversationSettings(
  conversationId: string,
  settings: ConversationSettings
): Promise<void> {
  const docRef = doc(db, 'conversations', conversationId);
  
  console.log('⚙️ Saving settings to Firestore:', {
    conversationId,
    settings: {
      avatarId: settings.avatarId,
      personality: settings.personality?.substring(0, 50) + '...',
      videoUrl: settings.avatarMediaUrl?.substring(0, 30) + '...'
    }
  });
  
  // Ensure all required fields have values
  const sanitizedSettings: ConversationSettings = {
    avatarId: settings.avatarId || 'default',
    avatarMediaUrl: settings.avatarMediaUrl || '',
    avatarPreviewImageUrl: settings.avatarPreviewImageUrl || '',
    avatarVoiceGender: settings.avatarVoiceGender || 'female',
    description: settings.description || 'A helpful AI assistant',
    personality: settings.personality || DEFAULT_CONVERSATION_SETTINGS.personality,
    tone: settings.tone || 'friendly',
    responseLength: settings.responseLength || 'Normal',
    language: settings.language || 'en',
    selectedGeminiModel: settings.selectedGeminiModel || 'gemini-1.5-flash'
  };
  
  await updateDoc(docRef, { 
    settings: sanitizedSettings
  });
  
  console.log('✅ Settings saved successfully');
}

// Update createConversation to use proper default settings
export async function createConversation(userId: string, title: string): Promise<string> {
  const conversationsRef = collection(db, 'conversations');
  
  console.log('🆕 Creating conversation:', { userId, title });
  
  const docRef = await addDoc(conversationsRef, {
    userId,
    title,
    createdAt: Timestamp.now(),
    settings: {
      ...DEFAULT_CONVERSATION_SETTINGS,
      // Ensure personality is set
      personality: DEFAULT_CONVERSATION_SETTINGS.personality
    }
  });
  
  console.log('✅ Conversation created with ID:', docRef.id);
  return docRef.id;
}