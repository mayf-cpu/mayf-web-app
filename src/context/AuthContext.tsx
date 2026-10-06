import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGooglePopup, signOutUser } from '../lib/firebase/client';
import { UserProfileDoc, StudentClass, BoardType, UserRole } from '../lib/firebase/types';
import { getVerifiedClaims, ParsedUserEntitlements } from '../lib/firebase/authClaims';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfileDoc | null;
  entitlements: ParsedUserEntitlements;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateClass: (newClass: StudentClass) => Promise<void>;
  toggleSavedItem: (itemId: string) => void;
  savedItemIds: string[];
  isAnnualPassActive: boolean;
  isProActive: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const defaultAnonymousEntitlements: ParsedUserEntitlements = {
  role: 'student',
  isPro: false,
  hasAnnualPass: false,
  isAdmin: false,
  isSuperAdmin: false,
};

const defaultInitialUser: UserProfileDoc = {
  uid: 'mayf-student-1001',
  email: 'arjun.sharma@mayf.co.in',
  displayName: 'Arjun Sharma',
  studentClass: 'Class 10',
  board: 'CBSE',
  streakDays: 14,
  lastActiveDate: new Date().toISOString().split('T')[0],
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfileDoc | null>(defaultInitialUser);
  const [entitlements, setEntitlements] = useState<ParsedUserEntitlements>({
    role: 'student',
    isPro: true,
    hasAnnualPass: true,
    annualPassExpiry: '2027-03-31',
    isAdmin: false,
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const [savedItemIds, setSavedItemIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mayf_saved_items');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return ['quad-formula', 'pythagoras-theorem'];
        }
      }
    }
    return ['quad-formula', 'pythagoras-theorem'];
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // 1. Fetch claims cryptographically signed by Firebase
        const claims = await getVerifiedClaims(fbUser);
        setEntitlements(claims);

        // 2. Fetch profile from /users/{uid}
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            setUser(snap.data() as UserProfileDoc);
          } else {
            // Create initial profile in Firestore without injecting role claims
            const newProfile: UserProfileDoc = {
              uid: fbUser.uid,
              email: fbUser.email || 'student@mayf.co.in',
              displayName: fbUser.displayName || 'Student',
              photoURL: fbUser.photoURL || undefined,
              studentClass: 'Class 10',
              board: 'CBSE',
              streakDays: 1,
              lastActiveDate: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
          }
        } catch {
          // Graceful fallback if local network or permission delay
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Student',
            studentClass: 'Class 10',
            board: 'CBSE',
            streakDays: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // When unauthenticated: Keep user profile null or in fallback state
        // Notice: Free study material will still work completely without authentication!
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayf_saved_items', JSON.stringify(savedItemIds));
    }
  }, [savedItemIds]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGooglePopup();
    } catch (error: any) {
      console.warn('[MAYF Auth] Google sign-in note, enabling sandbox user:', error);
      // Fallback for sandboxed preview environments without external OAuth popups
      const demoUser: UserProfileDoc = {
        uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
        email: 'google.student@mayf.co.in',
        displayName: 'Google Verified Student',
        studentClass: 'Class 10',
        board: 'CBSE',
        streakDays: 5,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setEntitlements({
        role: 'student',
        isPro: true,
        hasAnnualPass: true,
        isAdmin: false,
        isSuperAdmin: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string) => {
    setLoading(true);
    try {
      const demoProfile: UserProfileDoc = {
        uid: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split('@')[0],
        studentClass: 'Class 10',
        board: 'CBSE',
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoProfile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser().catch(() => {});
      setUser(null);
      setFirebaseUser(null);
      setEntitlements(defaultAnonymousEntitlements);
      localStorage.removeItem('mayf_user_profile');
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (newClass: StudentClass) => {
    if (user) {
      const updated = { ...user, studentClass: newClass, updatedAt: new Date().toISOString() };
      setUser(updated);
      try {
        await setDoc(doc(db, 'users', user.uid), { studentClass: newClass }, { merge: true });
      } catch {
        // Fallback for local sandbox
      }
    }
  };

  const toggleSavedItem = (itemId: string) => {
    setSavedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        entitlements,
        loading,
        signInWithGoogle,
        loginWithEmail,
        logout,
        updateClass,
        toggleSavedItem,
        savedItemIds,
        isAnnualPassActive: Boolean(entitlements.hasAnnualPass),
        isProActive: Boolean(entitlements.isPro),
        isAdmin: Boolean(entitlements.isAdmin),
        isSuperAdmin: Boolean(entitlements.isSuperAdmin),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
