import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export const getCollectionRef = (path: string) => collection(db, path);

// Generic function to subscribe to a collection
export function subscribeToCollection<T>(
  path: string, 
  callback: (data: T[]) => void,
  shopId: string
) {
  const q = query(
    collection(db, `shops/${shopId}/${path}`),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to ${path}:`, error);
  });
}

// Add Item
export async function addItem(shopId: string, path: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, `shops/${shopId}/${path}`), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
}

// Update Item
export async function updateItem(shopId: string, path: string, id: string, data: any) {
  try {
    const docRef = doc(db, `shops/${shopId}/${path}`, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
}
