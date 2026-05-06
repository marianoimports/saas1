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
  // Clean and validate shopId
  const cleanShopId = String(shopId).replace(/[^a-zA-Z0-9-_]/g, '');
  if (!cleanShopId || cleanShopId === 'undefined' || cleanShopId !== shopId) {
    console.error('subscribeToCollection: shopId is invalid:', shopId, 'cleaned:', cleanShopId);
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, `shops/${cleanShopId}/${path}`),
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
  if (!shopId || shopId === 'undefined' || shopId === undefined) {
    throw new Error('addItem: shopId is invalid');
  }
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
  if (!shopId || shopId === 'undefined' || shopId === undefined) {
    throw new Error('updateItem: shopId is invalid');
  }
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

// ==================== USER MANAGEMENT ====================
export async function deleteUser(userId: string) {
  try {
    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', userId));
    // Note: To delete from Firebase Auth, you need a Cloud Function
    console.log('User document deleted. Auth deletion requires Cloud Function.');
  } catch (error) {
    console.error("Error deleting user: ", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    // Import Firebase Auth dynamically to avoid circular deps
    const { sendPasswordResetEmail: firebaseSendReset } = await import('firebase/auth');
    const { auth } = await import('../firebase');
    await firebaseSendReset(auth, email);
  } catch (error) {
    console.error("Error sending password reset: ", error);
    throw error;
  }
}

// ==================== STRIPE INTEGRATION (Mock/Setup) ====================
export interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  webhookSecret: string;
  plans: {
    [key: string]: {
      priceId: string;
      productId: string;
    }
  };
}

export async function getStripeConfig(): Promise<StripeConfig | null> {
  try {
    const docRef = doc(db, 'settings', 'stripe');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as StripeConfig;
    }
    return null;
  } catch (error) {
    console.error("Error getting Stripe config: ", error);
    return null;
  }
}

export async function saveStripeConfig(config: Partial<StripeConfig>) {
  try {
    await setDoc(doc(db, 'settings', 'stripe'), {
      ...config,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving Stripe config: ", error);
    throw error;
  }
}

// ==================== APPOINTMENTS ====================
export function subscribeToAppointments<T>(
  shopId: string,
  callback: (data: T[]) => void
) {
  const q = query(
    collection(db, `shops/${shopId}/appointments`),
    orderBy('date', 'asc'),
    orderBy('time', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to appointments:`, error);
  });
}

export async function addAppointment(shopId: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, `shops/${shopId}/appointments`), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding appointment: ", error);
    throw error;
  }
}

export async function updateAppointment(shopId: string, appointmentId: string, data: any) {
  try {
    const docRef = doc(db, `shops/${shopId}/appointments`, appointmentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating appointment: ", error);
    throw error;
  }
}

// ==================== USER SUBSCRIPTIONS ====================
export function subscribeToUsers<T>(
  callback: (data: T[]) => void
) {
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to users:`, error);
  });
}

export async function createStripeCheckout(planId: string, userId: string, userEmail: string) {
  try {
    // In production, this would call a Firebase Cloud Function
    // that creates a Stripe Checkout Session
    const config = await getStripeConfig();
    if (!config?.enabled) {
      throw new Error('Stripe not configured');
    }

    const plan = await getDoc(doc(db, 'plans', planId));
    if (!plan.exists()) {
      throw new Error('Plan not found');
    }

    const planData = plan.data();
    const priceId = config.plans?.[planId]?.priceId;

    if (!priceId) {
      throw new Error('Stripe price ID not configured for this plan');
    }

    // Simulate API call to Cloud Function
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        planName: planData.name,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`
      })
    });

    return await response.json();
  } catch (error) {
    console.error("Error creating checkout: ", error);
    throw error;
  }
}
