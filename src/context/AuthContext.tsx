import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Teacher, Student, StaffMember } from '../types';
import { supabase } from '../lib/supabase';
import { getApiBaseUrl, api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  teacher: Teacher | null;
  student: Student | null;
  staff: StaffMember | null;
  firebaseUser: any;
  isEditMode: boolean;
  mfaEnabled: boolean;
  rememberMe: boolean;
  appUrl: string;
  isAuthenticated: boolean;
  activeRole: 'admin' | 'teacher' | 'student' | 'staff' | null;
  activeName: string;
  toggleMFA: (enabled: boolean) => Promise<void>;
  toggleEditMode: () => void;
  setRememberMePreference: (remember: boolean) => void;
  loginUser: (data: { user: User; teacher?: Teacher; student?: Student; staff?: StaffMember; mfaEnabled?: boolean; rememberMe?: boolean }) => void;
  logout: () => void;
  updateStudentState: (updated: Student) => void;
  updateTeacherState: (updated: Teacher) => void;
  updateStaffState: (updated: StaffMember) => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    const saved = localStorage.getItem('mps_remember_me');
    return saved === null ? true : saved === 'true';
  });

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

  const [staff, setStaff] = useState<StaffMember | null>(() => {
    try {
      const saved = localStorage.getItem('mps_staff');
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

  // Background profile synchronization on boot / return to keep details fresh without interrupting session
  useEffect(() => {
    let isMounted = true;

    async function syncActiveSession() {
      try {
        if (student?.id) {
          const freshStudent = await api.getStudent(student.id);
          if (isMounted && freshStudent && freshStudent.id === student.id) {
            setStudent(prev => ({ ...prev, ...freshStudent }));
            localStorage.setItem('mps_student', JSON.stringify({ ...student, ...freshStudent }));
          }
        } else if (teacher?.id) {
          const teachers = await api.getTeachers();
          const freshTeacher = teachers.find(t => t.id === teacher.id || (t.username && t.username === teacher.username));
          if (isMounted && freshTeacher) {
            setTeacher(prev => ({ ...prev, ...freshTeacher }));
            localStorage.setItem('mps_teacher', JSON.stringify({ ...teacher, ...freshTeacher }));
          }
        }
      } catch (err) {
        console.warn('Session background sync notice (offline or cached mode):', err);
      }
    }

    syncActiveSession();

    return () => {
      isMounted = false;
    };
  }, [student?.id, teacher?.id]);

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

  useEffect(() => {
    localStorage.setItem('mps_remember_me', String(rememberMe));
  }, [rememberMe]);

  const toggleEditMode = useCallback(() => {
    if (user?.role === 'admin') {
      setIsEditMode(prev => !prev);
    }
  }, [user?.role]);

  const setRememberMePreference = useCallback((remember: boolean) => {
    setRememberMe(remember);
    localStorage.setItem('mps_remember_me', String(remember));
  }, []);

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

  const loginUser = useCallback((data: {
    user: User;
    teacher?: Teacher;
    student?: Student;
    staff?: StaffMember;
    mfaEnabled?: boolean;
    rememberMe?: boolean;
  }) => {
    setUser(data.user);
    localStorage.setItem('mps_user', JSON.stringify(data.user));

    if (data.teacher) {
      setTeacher(data.teacher);
      localStorage.setItem('mps_teacher', JSON.stringify(data.teacher));
    }
    if (data.student) {
      setStudent(data.student);
      localStorage.setItem('mps_student', JSON.stringify(data.student));
    }
    if (data.staff) {
      setStaff(data.staff);
      localStorage.setItem('mps_staff', JSON.stringify(data.staff));
    }
    if (data.mfaEnabled !== undefined) {
      setMfaEnabled(data.mfaEnabled);
      localStorage.setItem('mps_mfa_enabled', String(data.mfaEnabled));
    }
    if (data.rememberMe !== undefined) {
      setRememberMe(data.rememberMe);
      localStorage.setItem('mps_remember_me', String(data.rememberMe));
    }

    localStorage.setItem('mps_session_authenticated', 'true');
    localStorage.setItem('mps_session_timestamp', String(Date.now()));

    if (data.user.role === 'admin') {
      setIsEditMode(true);
      localStorage.setItem('mps_edit_mode', 'true');
    }
  }, []);

  const logout = useCallback(() => {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    setUser(null);
    setTeacher(null);
    setStudent(null);
    setStaff(null);
    setIsEditMode(false);
    localStorage.removeItem('mps_user');
    localStorage.removeItem('mps_teacher');
    localStorage.removeItem('mps_student');
    localStorage.removeItem('mps_staff');
    localStorage.removeItem('mps_edit_mode');
    localStorage.removeItem('mps_mfa_enabled');
    localStorage.removeItem('mps_session_authenticated');
    localStorage.removeItem('mps_session_timestamp');
    
    // Force clean redirect to homepage on explicit logout
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const updateStudentState = useCallback((updated: Student) => {
    setStudent(updated);
    try {
      localStorage.setItem('mps_student', JSON.stringify(updated));
    } catch (e) {}
  }, []);

  const updateTeacherState = useCallback((updated: Teacher) => {
    setTeacher(updated);
    try {
      localStorage.setItem('mps_teacher', JSON.stringify(updated));
    } catch (e) {}
  }, []);

  const updateStaffState = useCallback((updated: StaffMember) => {
    setStaff(updated);
    try {
      localStorage.setItem('mps_staff', JSON.stringify(updated));
    } catch (e) {}
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

  const isAuthenticated = useMemo(() => {
    return Boolean(user || teacher || student || staff);
  }, [user, teacher, student, staff]);

  const activeRole = useMemo<'admin' | 'teacher' | 'student' | 'staff' | null>(() => {
    if (user?.role === 'admin') return 'admin';
    if (teacher || user?.role === 'teacher') return 'teacher';
    if (student || user?.role === 'student') return 'student';
    if (staff || user?.role === 'staff') return 'staff';
    return null;
  }, [user, teacher, student, staff]);

  const activeName = useMemo<string>(() => {
    if (student?.name) return student.name;
    if (teacher?.name) return teacher.name;
    if (staff?.name) return staff.name;
    if (user?.name) return user.name;
    return '';
  }, [student, teacher, staff, user]);

  const contextValue = useMemo(() => ({
    user,
    teacher,
    student,
    staff,
    firebaseUser,
    isEditMode,
    mfaEnabled,
    rememberMe,
    appUrl,
    isAuthenticated,
    activeRole,
    activeName,
    toggleMFA,
    toggleEditMode,
    setRememberMePreference,
    loginUser,
    logout,
    updateStudentState,
    updateTeacherState,
    updateStaffState,
    getIdToken
  }), [
    user,
    teacher,
    student,
    staff,
    firebaseUser,
    isEditMode,
    mfaEnabled,
    rememberMe,
    appUrl,
    isAuthenticated,
    activeRole,
    activeName,
    toggleMFA,
    toggleEditMode,
    setRememberMePreference,
    loginUser,
    logout,
    updateStudentState,
    updateTeacherState,
    updateStaffState,
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

