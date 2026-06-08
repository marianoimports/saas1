import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthUser {
  uid: string;
  email: string | undefined;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  userData: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'michaelmarianodasilva81@gmail.com';

export const createUserDocument = async (authUser: SupabaseUser, additionalData: Record<string, any> = {}) => {
  if (!authUser) return;

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('uid', authUser.id)
    .single();

  if (!existing) {
    const { error } = await supabase.from('users').insert({
      uid: authUser.id,
      email: authUser.email,
      display_name: authUser.user_metadata?.display_name || additionalData.displayName || '',
      role: 'owner',
      is_admin: false,
      shop_id: authUser.id,
      ...additionalData,
    });
    if (error) {
      console.error('Error creating user document:', error);
    } else {
      console.log('User document created with shopId:', authUser.id);
    }
  } else {
    if (!existing.shop_id) {
      await supabase
        .from('users')
        .update({ shop_id: authUser.id })
        .eq('uid', authUser.id);
      console.log('Updated user with shopId:', authUser.id);
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async (userObj?: AuthUser): Promise<boolean> => {
    const currentUser = userObj || user;
    if (!currentUser?.uid) return false;

    if (currentUser.email === ADMIN_EMAIL) {
      console.log('ADMIN: Email matches, forcing admin = true');
      setIsAdmin(true);
      setUserData({ role: 'admin', isAdmin: true, email: currentUser.email, shopId: currentUser.uid });
      return true;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('uid', currentUser.uid)
        .single();

      if (data) {
        setUserData(data);
        const adminStatus = data.role === 'admin' || data.is_admin === true;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser: AuthUser = {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || null,
        };
        setUser(authUser);
        createUserDocument(session.user).then(() => loadUserData(session.user));
        checkAdminStatus(authUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || null,
        };
        setUser(authUser);
        await createUserDocument(session.user);
        await loadUserData(session.user);
        await checkAdminStatus(authUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (sbUser: SupabaseUser) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('uid', sbUser.id)
      .single();

    if (data) {
      const validShopId = data.shop_id && data.shop_id !== 'undefined' ? data.shop_id : sbUser.id;
      setUserData({ ...data, shopId: validShopId });
      console.log('User data loaded with shopId:', validShopId);
    } else {
      setUserData({ shopId: sbUser.id, email: sbUser.email });
      console.log('No user doc, using uid as shopId:', sbUser.id);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

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
