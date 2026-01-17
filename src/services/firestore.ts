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

export async function createConversation(userId: string, title: string): Promise<string> {
  const conversationsRef = collection(db, 'conversations');
  const docRef = await addDoc(conversationsRef, {
    userId,
    title,
    createdAt: Timestamp.now(),
    settings: DEFAULT_CONVERSATION_SETTINGS
  });
  return docRef.id;
}

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

export async function updateConversationSettings(
  conversationId: string,
  settings: ConversationSettings
): Promise<void> {
  const docRef = doc(db, 'conversations', conversationId);
  await updateDoc(docRef, { settings });
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  await deleteDoc(doc(db, 'conversations', conversationId));
}

export async function addMessage(message: Omit<Message, 'id'>): Promise<string> {
  const messagesRef = collection(db, 'messages');
  const docRef = await addDoc(messagesRef, {
    ...message,
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

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
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      conversationId: doc.data().conversationId,
      sender: doc.data().sender,
      text: doc.data().text,
      videoUrl: doc.data().videoUrl,
      createdAt: doc.data().createdAt.toDate()
    }));
    callback(messages);
  });
}
