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
  getDocs,
  getDoc,
  setDoc,
  limit
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

// ==================== SHOPS ====================
export async function addShop(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'shops'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding shop: ", error);
    throw error;
  }
}

export async function updateShop(shopId: string, data: any) {
  try {
    const docRef = doc(db, 'shops', shopId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating shop: ", error);
    throw error;
  }
}

export function subscribeToShops<T>(
  callback: (data: T[]) => void
) {
  const q = query(
    collection(db, 'shops'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to shops:`, error);
  });
}

export async function getShopsCount(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, 'shops'));
    return snapshot.size;
  } catch (error) {
    console.error("Error getting shops count: ", error);
    return 0;
  }
}

export async function getActiveShopsCount(): Promise<number> {
  try {
    const q = query(collection(db, 'shops'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting active shops count: ", error);
    return 0;
  }
}

// ==================== PLANS ====================
export async function addPlan(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'plans'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding plan: ", error);
    throw error;
  }
}

export async function updatePlan(planId: string, data: any) {
  try {
    const docRef = doc(db, 'plans', planId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating plan: ", error);
    throw error;
  }
}

export function subscribeToPlans<T>(
  callback: (data: T[]) => void
) {
  const q = query(
    collection(db, 'plans'),
    orderBy('price', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to plans:`, error);
  });
}

export async function getPlanById(planId: string): Promise<any> {
  try {
    const docRef = doc(db, 'plans', planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting plan: ", error);
    return null;
  }
}

// ==================== STATS ====================
export async function getTotalUsersCount(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.size;
  } catch (error) {
    console.error("Error getting users count: ", error);
    return 0;
  }
}

// ==================== ADMIN MANAGEMENT ====================
export async function setUserAsAdmin(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      isAdmin: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error setting user as admin: ", error);
    throw error;
  }
}

export async function checkIfAdminExists(): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking admin existence: ", error);
    return false;
  }
}

export async function getMRR(): Promise<number> {
  try {
    const q = query(
      collection(db, 'shops'),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    let mrr = 0;
    snapshot.forEach(doc => {
      const shop = doc.data();
      // Sum up monthly revenue from active shops
      mrr += shop.monthlyRevenue || 0;
    });
    return mrr;
  } catch (error) {
    console.error("Error calculating MRR: ", error);
    return 0;
  }
}

export async function getNewShopsLast30Days(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
      collection(db, 'shops'),
      where('createdAt', '>=', thirtyDaysAgo)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting new shops: ", error);
    return 0;
  }
}
