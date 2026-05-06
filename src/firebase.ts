import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Function to create/update user document in Firestore
export const createUserDocument = async (user: any, additionalData: any = {}) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDocFromServer(userRef);
  
  if (!snapshot.exists()) {
    const { email, displayName } = user;
    try {
      // Create user doc with a shopId (use uid as shopId for simplicity)
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || '',
        role: 'owner', // default role
        isAdmin: false,
        shopId: user.uid, // Use uid as shopId
        createdAt: serverTimestamp(),
        ...additionalData
      });
      console.log('User document created with shopId:', user.uid);
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  } else {
    // Update shopId if missing
    const data = snapshot.data();
    if (!data.shopId) {
      await setDoc(userRef, { shopId: user.uid }, { merge: true });
      console.log('Updated user with shopId:', user.uid);
    }
  }
};

// Helper function to get shopId (creates if doesn't exist)
export const getShopId = async (user: any) => {
  if (!user?.uid) return '';
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDocFromServer(userRef);
  
  if (snapshot.exists()) {
    const data = snapshot.data();
    if (data.shopId) return data.shopId;
  }
  
  // Create if doesn't exist
  await createUserDocument(user);
  return user.uid;
};

export const loginWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);
export const registerWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
