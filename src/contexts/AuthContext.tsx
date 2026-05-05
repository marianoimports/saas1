import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth, loginWithEmail, registerWithEmail, createUserDocument } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  userData: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (userObj?: any): Promise<boolean> => {
    const currentUser = userObj || user;
    if (!currentUser?.uid) return false;
    
    // DIRECT CHECK: if email matches, always return true
    if (currentUser.email === 'michaelmarianodasilva81@gmail.com') {
      console.log('ADMIN: Email matches, forcing admin = true');
      setIsAdmin(true);
      setUserData({ role: 'admin', isAdmin: true, email: currentUser.email });
      
      // Try to create/update user doc in background
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'admin',
          isAdmin: true,
          displayName: currentUser.displayName || 'Admin',
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.log('Background doc update failed, but admin forced:', e);
      }
      
      return true;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        const adminStatus = data.role === 'admin' || data.isAdmin === true;
        setIsAdmin(adminStatus);
        return adminStatus;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Create user document if it doesn't exist
        await createUserDocument(currentUser);
        await checkAdminStatus(currentUser.uid);
      } else {
        setIsAdmin(false);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password);
  };

  const register = async (email: string, password: string) => {
    await registerWithEmail(email, password);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, isAdmin, userData, loading, login, register, logout, checkAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
