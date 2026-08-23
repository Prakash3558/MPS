import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Teacher, Student } from '../types';
import { supabase } from '../lib/supabase';
import { getApiBaseUrl } from '../lib/api';

interface AuthContextType {
  user: User | null;
  teacher: Teacher | null;
  student: Student | null;
  firebaseUser: any;
  isEditMode: boolean;
  mfaEnabled: boolean;
  appUrl: string;
  toggleMFA: (enabled: boolean) => Promise<void>;
  toggleEditMode: () => void;
  loginUser: (data: { user: User; teacher?: Teacher; student?: Student; mfaEnabled?: boolean }) => void;
  logout: () => void;
  updateStudentState: (updated: Student) => void;
  updateTeacherState: (updated: Teacher) => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mps_mfa_enabled') === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('mps_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [teacher, setTeacher] = useState<Teacher | null>(() => {
    try {
      const saved = localStorage.getItem('mps_teacher');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [student, setStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem('mps_student');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('mps_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      if (parsedUser?.role === 'admin') {
        return localStorage.getItem('mps_edit_mode') === 'true';
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  const appUrl = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sUser = session?.user || null;
      setFirebaseUser(sUser);
      if (sUser) {
        try {
          supabase.from('users').upsert({
            id: sUser.id,
            email: sUser.email || '',
            displayName: sUser.user_metadata?.name || user?.name || 'MPS User',
            role: user?.role || 'student',
            createdAt: new Date().toISOString()
          }).then(() => {});

          supabase.from('user_preferences').select('*').eq('id', sUser.id).maybeSingle().then(({ data: prefs }) => {
            if (prefs && prefs.mfaEnabled !== undefined) {
              setMfaEnabled(Boolean(prefs.mfaEnabled));
              localStorage.setItem('mps_mfa_enabled', String(prefs.mfaEnabled));
            }
          });
        } catch (e) {
          console.warn('Supabase user sync notice:', e);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [user?.role, user?.name]);

  useEffect(() => {
    if (user) localStorage.setItem('mps_user', JSON.stringify(user));
    else localStorage.removeItem('mps_user');
  }, [user]);

  useEffect(() => {
    if (teacher) localStorage.setItem('mps_teacher', JSON.stringify(teacher));
    else localStorage.removeItem('mps_teacher');
  }, [teacher]);

  useEffect(() => {
    if (student) localStorage.setItem('mps_student', JSON.stringify(student));
    else localStorage.removeItem('mps_student');
  }, [student]);

  useEffect(() => {
    localStorage.setItem('mps_edit_mode', String(isEditMode));
  }, [isEditMode]);

  useEffect(() => {
    localStorage.setItem('mps_mfa_enabled', String(mfaEnabled));
  }, [mfaEnabled]);

  const toggleEditMode = useCallback(() => {
    if (user?.role === 'admin') {
      setIsEditMode(prev => !prev);
    }
  }, [user?.role]);

  const toggleMFA = useCallback(async (enabled: boolean) => {
    setMfaEnabled(enabled);
    localStorage.setItem('mps_mfa_enabled', String(enabled));
    const uid = firebaseUser?.id || firebaseUser?.uid;
    if (uid) {
      try {
        await supabase.from('user_preferences').upsert({
          id: uid,
          userId: uid,
          mfaEnabled: enabled,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error saving MFA preference:', e);
      }
    }
  }, [firebaseUser]);

  const loginUser = useCallback((data: { user: User; teacher?: Teacher; student?: Student; mfaEnabled?: boolean }) => {
    setUser(data.user);
    if (data.teacher) setTeacher(data.teacher);
    if (data.student) setStudent(data.student);
    if (data.mfaEnabled !== undefined) {
      setMfaEnabled(data.mfaEnabled);
      localStorage.setItem('mps_mfa_enabled', String(data.mfaEnabled));
    }
    if (data.user.role === 'admin') setIsEditMode(true);
  }, []);

  const logout = useCallback(() => {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    setUser(null);
    setTeacher(null);
    setStudent(null);
    setIsEditMode(false);
    localStorage.removeItem('mps_user');
    localStorage.removeItem('mps_teacher');
    localStorage.removeItem('mps_student');
    localStorage.removeItem('mps_edit_mode');
    localStorage.removeItem('mps_mfa_enabled');
    // Force direct redirect to homepage on logout
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const updateStudentState = useCallback((updated: Student) => {
    setStudent(updated);
  }, []);

  const updateTeacherState = useCallback((updated: Teacher) => {
    setTeacher(updated);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch (e) {
      console.error('Error fetching Supabase session token:', e);
    }
    return null;
  }, []);

  const contextValue = useMemo(() => ({
    user,
    teacher,
    student,
    firebaseUser,
    isEditMode,
    mfaEnabled,
    appUrl,
    toggleMFA,
    toggleEditMode,
    loginUser,
    logout,
    updateStudentState,
    updateTeacherState,
    getIdToken
  }), [
    user,
    teacher,
    student,
    firebaseUser,
    isEditMode,
    mfaEnabled,
    appUrl,
    toggleMFA,
    toggleEditMode,
    loginUser,
    logout,
    updateStudentState,
    updateTeacherState,
    getIdToken
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

