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
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || '',
        role: 'owner', // default role
        isAdmin: false,
        createdAt: serverTimestamp(),
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
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
