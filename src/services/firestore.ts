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
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conversation, Message, ConversationSettings, DEFAULT_CONVERSATION_SETTINGS, Company, CompanyDocument } from '../types';

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

export async function updateConversationTitle(conversationId: string, newTitle: string): Promise<void> {
  const docRef = doc(db, 'conversations', conversationId);
  await updateDoc(docRef, { title: newTitle });
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

  const messageData: any = {
    conversationId: message.conversationId,
    sender: message.sender,
    text: message.text,
    createdAt: Timestamp.now()
  };

  if (message.transcript !== undefined) {
    messageData.transcript = message.transcript;
  }

  if (message.videoUrl !== undefined && message.videoUrl !== null) {
    messageData.videoUrl = message.videoUrl;
  }

  if (message.videoUrls !== undefined && message.videoUrls !== null) {
    messageData.videoUrls = message.videoUrls;
  }

  const docRef = await addDoc(messagesRef, messageData);
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
      transcript: doc.data().transcript,
      videoUrl: doc.data().videoUrl,
      videoUrls: doc.data().videoUrls,
      createdAt: doc.data().createdAt.toDate()
    }));
    callback(messages);
  });
}

export async function createCompany(userEmail: string, name: string): Promise<string> {
  const companiesRef = collection(db, 'companies');
  const docRef = await addDoc(companiesRef, {
    name,
    createdBy: userEmail,
    createdAt: Timestamp.now(),
    members: [userEmail],
    settings: DEFAULT_CONVERSATION_SETTINGS
  });
  return docRef.id;
}

export function subscribeToUserCompanies(
  userEmailOrId: string,
  callback: (companies: Company[]) => void
): () => void {
  const companiesRef = collection(db, 'companies');
  const q = query(
    companiesRef,
    where('members', 'array-contains', userEmailOrId)
  );

  return onSnapshot(q, (snapshot) => {
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdBy: doc.data().createdBy,
      createdAt: doc.data().createdAt.toDate(),
      members: doc.data().members,
      settings: doc.data().settings || DEFAULT_CONVERSATION_SETTINGS
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(companies);
  });
}

export async function addCompanyMember(companyId: string, memberEmail: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, {
    members: arrayUnion(memberEmail)
  });
}

export async function updateCompanySettings(
  companyId: string,
  settings: ConversationSettings
): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, { settings });
}

export async function updateCompanyName(companyId: string, newName: string): Promise<void> {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, { name: newName });
}

export async function addCompanyDocument(document: Omit<CompanyDocument, 'id'>): Promise<string> {
  const documentsRef = collection(db, 'company_documents');
  const docRef = await addDoc(documentsRef, {
    ...document,
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

export function subscribeToCompanyDocuments(
  companyId: string,
  callback: (documents: CompanyDocument[]) => void
): () => void {
  const documentsRef = collection(db, 'company_documents');
  const q = query(
    documentsRef,
    where('companyId', '==', companyId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      companyId: doc.data().companyId,
      title: doc.data().title,
      content: doc.data().content,
      uploadedBy: doc.data().uploadedBy,
      createdAt: doc.data().createdAt.toDate()
    }));
    callback(documents);
  });
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const docRef = doc(db, 'companies', companyId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    createdBy: data.createdBy,
    createdAt: data.createdAt.toDate(),
    members: data.members,
    settings: data.settings || DEFAULT_CONVERSATION_SETTINGS
  };
}

export function subscribeToCompany(
  companyId: string,
  callback: (company: Company | null) => void
): () => void {
  const docRef = doc(db, 'companies', companyId);

  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      id: docSnap.id,
      name: data.name,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      members: data.members,
      settings: data.settings || DEFAULT_CONVERSATION_SETTINGS
    });
  });
}
