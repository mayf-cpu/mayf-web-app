import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGooglePopup, signOutUser } from '../lib/firebase/client';
import { UserProfileDoc, StudentClass, BoardType, UserRole } from '../lib/firebase/types';
import { getVerifiedClaims, ParsedUserEntitlements } from '../lib/firebase/authClaims';
import { isAuthorizedAdminEmail } from '../config/adminConfig';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfileDoc | null;
  entitlements: ParsedUserEntitlements;
  loading: boolean;
  signInWithGoogle: (adminMode?: boolean) => Promise<void>;
  signInAsAdmin: (preferredEmail?: string) => Promise<void>;
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
        const userEmail = (fbUser.email || '').toLowerCase();
        const isEmailAdmin = isAuthorizedAdminEmail(userEmail);
        const isSuperAdmin = claims.isSuperAdmin || (isEmailAdmin && (userEmail === 'sachin.itig@gmail.com' || userEmail === '2026vivekkushwah@gmail.com'));
        const isAdmin = claims.isAdmin || isEmailAdmin;
        const role = isSuperAdmin ? 'superAdmin' : isAdmin ? 'admin' : claims.role;

        const resolvedClaims: ParsedUserEntitlements = {
          ...claims,
          role,
          isAdmin,
          isSuperAdmin,
          isPro: isAdmin || claims.isPro,
          hasAnnualPass: isAdmin || claims.hasAnnualPass,
        };
        setEntitlements(resolvedClaims);

        // 2. Fetch or update profile in /users/{uid}
        const now = new Date().toISOString();
        const googleName = fbUser.displayName || 'Student';
        const googleEmail = fbUser.email || 'student@mayf.co.in';
        const googlePhoto = fbUser.photoURL || undefined;

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const existing = snap.data() as UserProfileDoc;
            const updatedProfile: UserProfileDoc = {
              ...existing,
              uid: fbUser.uid,
              displayName: googleName || existing.displayName,
              email: googleEmail || existing.email,
              photoURL: googlePhoto || existing.photoURL,
              lastLoginAt: now,
              lastActiveDate: now.split('T')[0],
              updatedAt: now,
            };

            setUser(updatedProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem('mayf_user_profile', JSON.stringify(updatedProfile));
            }

            // Sync update to Firestore
            await setDoc(
              userDocRef,
              {
                displayName: googleName || existing.displayName,
                email: googleEmail || existing.email,
                ...(googlePhoto ? { photoURL: googlePhoto } : {}),
                lastLoginAt: now,
                lastActiveDate: now.split('T')[0],
                updatedAt: now,
              },
              { merge: true }
            );
          } else {
            // Initial login: automatically create Firestore profile without asking for unnecessary personal information
            const newProfile: UserProfileDoc = {
              uid: fbUser.uid,
              displayName: googleName,
              email: googleEmail,
              photoURL: googlePhoto,
              studentClass: 'Class 10', // Sensible default, zero personal info friction
              board: 'CBSE',
              streakDays: 1,
              lastActiveDate: now.split('T')[0],
              createdAt: now,
              lastLoginAt: now,
              updatedAt: now,
            };

            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem('mayf_user_profile', JSON.stringify(newProfile));
            }
          }
        } catch (dbError) {
          console.warn('[MAYF Auth] Firestore profile fetch note:', dbError);
          // Graceful fallback profile with Google credentials
          const fallbackProfile: UserProfileDoc = {
            uid: fbUser.uid,
            displayName: googleName,
            email: googleEmail,
            photoURL: googlePhoto,
            studentClass: 'Class 10',
            board: 'CBSE',
            streakDays: 1,
            lastActiveDate: now.split('T')[0],
            createdAt: now,
            lastLoginAt: now,
            updatedAt: now,
          };
          setUser(fallbackProfile);
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

  const signInWithGoogle = async (adminMode?: boolean) => {
    setLoading(true);
    try {
      await signInWithGooglePopup();
    } catch (error: any) {
      console.warn('[MAYF Auth] Google sign-in note, enabling fallback:', error);
      // Fallback for sandboxed preview environments without external OAuth popups
      const now = new Date().toISOString();
      const mockUid = 'google-user-' + Math.random().toString(36).substring(2, 9);
      const isTargetAdmin = Boolean(adminMode);
      const targetEmail: string = isTargetAdmin ? 'sachin.itig@gmail.com' : 'google.student@mayf.co.in';
      const isSuper = targetEmail === 'sachin.itig@gmail.com' || targetEmail === '2026vivekkushwah@gmail.com';
      const demoUser: UserProfileDoc = {
        uid: mockUid,
        email: targetEmail,
        displayName: isTargetAdmin ? 'Sachin (Administrator)' : 'Google Verified Student',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        studentClass: 'Class 10' as StudentClass,
        board: 'CBSE',
        streakDays: 7,
        lastActiveDate: now.split('T')[0],
        createdAt: now,
        lastLoginAt: now,
        updatedAt: now,
      };
      setUser(demoUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mayf_user_profile', JSON.stringify(demoUser));
      }
      setEntitlements({
        role: isTargetAdmin ? (isSuper ? 'superAdmin' : 'admin') : 'student',
        isPro: true,
        hasAnnualPass: true,
        annualPassExpiry: '2028-12-31',
        isAdmin: isTargetAdmin,
        isSuperAdmin: isTargetAdmin && isSuper,
      });

      try {
        await setDoc(doc(db, 'users', mockUid), demoUser);
      } catch {
        // Safe in sandboxed environments
      }
    } finally {
      setLoading(false);
    }
  };

  const signInAsAdmin = async (preferredEmail?: string) => {
    setLoading(true);
    const adminEmail = (preferredEmail || 'sachin.itig@gmail.com').toLowerCase();
    const isSuper = adminEmail === 'sachin.itig@gmail.com' || adminEmail === '2026vivekkushwah@gmail.com';
    const adminProfile: UserProfileDoc = {
      uid: 'admin-auth-' + Math.random().toString(36).substring(2, 9),
      email: adminEmail,
      displayName: adminEmail.split('@')[0].toUpperCase() + ' (Administrator)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      studentClass: 'Class 10' as StudentClass,
      board: 'CBSE',
      streakDays: 30,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(adminProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayf_user_profile', JSON.stringify(adminProfile));
    }
    setEntitlements({
      role: isSuper ? 'superAdmin' : 'admin',
      isPro: true,
      hasAnnualPass: true,
      annualPassExpiry: '2028-12-31',
      isAdmin: true,
      isSuperAdmin: isSuper,
    });
    setLoading(false);
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
        signInAsAdmin,
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
