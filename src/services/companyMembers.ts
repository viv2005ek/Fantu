import { collection, doc, setDoc, deleteDoc, getDocs, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CompanyMember {
  id: string;
  company_id: string;
  email: string;
  role: 'owner' | 'member';
  added_by: string;
  created_at: Date;
}

export async function getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  try {
    const membersRef = collection(db, 'company_members');
    const q = query(membersRef, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date()
    })) as CompanyMember[];
  } catch (error) {
    console.error('Error fetching company members:', error);
    throw error;
  }
}

export function subscribeToCompanyMembers(
  companyId: string,
  callback: (members: CompanyMember[]) => void
): () => void {
  const membersRef = collection(db, 'company_members');
  const q = query(membersRef, where('company_id', '==', companyId));

  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date()
    })) as CompanyMember[];
    callback(members);
  });
}

export async function addCompanyMemberToFirestore(
  companyId: string,
  email: string,
  role: 'owner' | 'member',
  addedBy: string
): Promise<void> {
  try {
    const memberId = `${companyId}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const memberRef = doc(db, 'company_members', memberId);

    await setDoc(memberRef, {
      company_id: companyId,
      email: email,
      role: role,
      added_by: addedBy,
      created_at: Timestamp.now()
    });
  } catch (error) {
    console.error('Error adding company member:', error);
    throw error;
  }
}

export async function removeCompanyMember(memberId: string): Promise<void> {
  try {
    const memberRef = doc(db, 'company_members', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    console.error('Error removing company member:', error);
    throw error;
  }
}

export async function ensureCompanyOwner(
  companyId: string,
  ownerEmail: string
): Promise<void> {
  try {
    const members = await getCompanyMembers(companyId);
    const ownerExists = members.some(m => m.email === ownerEmail && m.role === 'owner');

    if (!ownerExists) {
      await addCompanyMemberToFirestore(companyId, ownerEmail, 'owner', ownerEmail);
    }
  } catch (error) {
    console.error('Error ensuring company owner:', error);
    throw error;
  }
}
