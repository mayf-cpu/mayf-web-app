import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StudentProfile, StudentClass } from '../lib/firebase/types';
import { isLiveFirebaseConfigured } from '../lib/firebase/client';

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  login: (email: string, role?: 'student' | 'parent') => Promise<void>;
  logout: () => Promise<void>;
  updateClass: (newClass: StudentClass) => void;
  toggleSavedItem: (itemId: string) => void;
  savedItemIds: string[];
  isAnnualPassActive: boolean;
}

const defaultStudentProfile: StudentProfile = {
  uid: 'mayf-student-1001',
  email: 'student.arjun@mayf.co.in',
  displayName: 'Arjun Sharma',
  studentClass: 'Class 10',
  board: 'CBSE',
  hasAnnualPass: true,
  passExpiryDate: '2027-03-31',
  streakDays: 14,
  lastActiveDate: new Date().toISOString().split('T')[0],
  createdAt: '2026-04-01',
  role: 'student',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentProfile | null>(() => {
    // Check localStorage for persisted user profile in dev/preview
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mayf_user_profile');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return defaultStudentProfile;
        }
      }
    }
    return defaultStudentProfile;
  });

  const [savedItemIds, setSavedItemIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mayf_saved_items');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return ['quad-formula', 'pythagoras-theorem', 'ch-quadratic-equations'];
        }
      }
    }
    return ['quad-formula', 'pythagoras-theorem', 'ch-quadratic-equations'];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('mayf_user_profile', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayf_saved_items', JSON.stringify(savedItemIds));
    }
  }, [savedItemIds]);

  const login = async (email: string, role: 'student' | 'parent' = 'student') => {
    setLoading(true);
    try {
      // Simulate authentication flow / Firebase Auth integration
      await new Promise((res) => setTimeout(res, 400));
      const newUser: StudentProfile = {
        uid: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split('@')[0],
        studentClass: 'Class 10',
        board: 'CBSE',
        hasAnnualPass: false,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        role,
      };
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 200));
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mayf_user_profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateClass = (newClass: StudentClass) => {
    if (user) {
      setUser({ ...user, studentClass: newClass });
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
        user,
        loading,
        login,
        logout,
        updateClass,
        toggleSavedItem,
        savedItemIds,
        isAnnualPassActive: Boolean(user?.hasAnnualPass),
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
