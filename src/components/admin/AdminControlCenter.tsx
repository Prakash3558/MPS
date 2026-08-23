import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../lib/api';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { CountryPhoneInput } from '../common/CountryPhoneInput';
import { CaptchaWidget } from '../common/CaptchaWidget';
import { Teacher, Student, Notice, AdmissionApplication, OnlineClass, OnlineExam } from '../../types';
import { WebsiteCMSManager } from './WebsiteCMSManager';
import { SchoolFinanceSystem } from './SchoolFinanceSystem';
import { AdminGlobalSearch, AdminTabType } from './AdminGlobalSearch';
import {
  Palette, Users, GraduationCap, Megaphone, ClipboardList, Image, Settings, Home, LogOut,
  X, Menu, Plus, Trash2, Search, Check, AlertTriangle, Edit3, Download, Key, ShieldAlert,
  Upload, Phone, Mail, UserPlus, CheckCircle, XCircle, Clock, Sparkles, School, Eye, EyeOff,
  Video, FileQuestion, DollarSign
} from 'lucide-react';

export const AdminControlCenter: React.FC = () => {
  const { user, loginUser, logout, isEditMode, toggleEditMode } = useAuth();
  const { settings, updateSettings } = useCMS();

  // Navigation state
  const [activeTab, setActiveTab] = useState<
    'site_content' | 'teachers' | 'students' | 'fees' | 'online_classes' | 'online_exams' | 'notices' | 'admissions' | 'gallery' | 'account'
  >('site_content');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Admin Login State
  const { mfaEnabled, toggleMFA } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: '', phone: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [mfaState, setMfaState] = useState<{ required: boolean; userId?: string; mobileEnding?: string; tempUser?: any } | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // Security credentials change
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', newPhone: '', newEmail: '' });
  const [securityMsg, setSecurityMsg] = useState({ type: '', text: '' });

  // Data lists
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [admissionFilter, setAdmissionFilter] = useState<'All' | 'Pending' | 'Contacted' | 'Approved' | 'Rejected'>('All');
  const [feeClassFilter, setFeeClassFilter] = useState('All');
  const [feeSearch, setFeeSearch] = useState('');

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingTeacherProfile, setEditingTeacherProfile] = useState<Teacher | null>(null);
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    username: '',
    password: '',
    subject: 'Mathematics',
    assignedClass: '10',
    assignedSection: 'A',
    phone: '',
    email: ''
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNo: '',
    class: '10',
    section: 'A',
    parentName: '',
    phone: '',
    email: '',
    address: 'Sikta, West Champaran',
    feePending: 3500,
    annualFeeFree: false,
    admissionFeeFree: false,
    examFeeFree: false,
    hostelAddon: false,
    hostelAmount: 5000,
    transportAddon: false,
    transportAmount: 750
  });

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'Urgent' as const,
    targetClass: 'All',
    isUrgentTicker: true
  });

  // Global Realtime Refresh hook for Admin Control Center
  const adminTopics = [
    'public:teachers',
    'public:students',
    'public:notice_board',
    'public:online_classes',
    'public:fee_records',
    'public:media_gallery',
    'public:site_settings'
  ] as const;

  const { refreshCount } = useSupabaseRealtimeRefresh(
    adminTopics,
    useCallback((event) => {
      if (user?.role === 'admin') {
        console.log(`[AdminControlCenter] Realtime broadcast on ${event.topic} received -> refreshing admin tables`);
        loadAdminData();
      }
    }, [user]),
    user?.role === 'admin'
  );

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, refreshCount]);

  // Online Classes & Exams Admin State
  const [adminOnlineClasses, setAdminOnlineClasses] = useState<OnlineClass[]>([]);
  const [adminOnlineExams, setAdminOnlineExams] = useState<OnlineExam[]>([]);

  const [adminNewClass, setAdminNewClass] = useState({
    class: '10',
    section: 'A',
    subject: 'Mathematics',
    title: '',
    teacherName: 'MPS Faculty',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    zoomUrl: 'https://zoom.us/j/84920193821',
    passcode: 'MPS2026',
    meetingId: '849 2019 3821',
    status: 'Scheduled' as 'Scheduled' | 'Live' | 'Completed'
  });

  const [adminNewExam, setAdminNewExam] = useState({
    class: '10',
    section: 'A',
    subject: 'Science',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    durationMinutes: 120,
    totalMarks: 100,
    zoomUrl: 'https://zoom.us/j/98123049182',
    instructions: 'Follow standard examination proctoring guidelines.',
    status: 'Scheduled' as 'Scheduled' | 'Live' | 'Completed'
  });

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [tList, stList, nots, adms, oClasses, oExams] = await Promise.all([
        api.getTeachers(),
        api.getStudents(),
        api.getNotices(),
        api.getAdmissions(),
        api.getOnlineClasses().catch(() => []),
        api.getOnlineExams().catch(() => [])
      ]);
      setTeachers(tList || []);
      setStudents(stList || []);
      setNotices(nots || []);
      setAdmissions(adms || []);
      setAdminOnlineClasses(oClasses || []);
      setAdminOnlineExams(oExams || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await api.login({
        role: 'admin',
        username: loginForm.username.trim(),
        password: loginForm.password.trim(),
        captchaToken: captchaToken || undefined
      });
      if (res.success && res.user) {
        loginUser({ user: res.user });
      } else {
        setLoginError(res.message || 'Invalid administrator username or password.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate. Please check your connection and credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleChangeAdminSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg({ type: '', text: '' });
    try {
      const res = await api.changeAdminPassword(securityForm);
      if (res.success) {
        setSecurityMsg({
          type: 'success',
          text: 'Admin Security Credentials & Mobile Number Updated Successfully!'
        });
        setSecurityForm({ currentPassword: '', newUsername: '', newPassword: '', newPhone: '', newEmail: '' });
      } else {
        setSecurityMsg({ type: 'error', text: res.message || 'Failed to update admin credentials.' });
      }
    } catch (err) {
      setSecurityMsg({ type: 'error', text: 'Server error updating admin credentials.' });
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = 't-' + Date.now();
    const tempTeacher: Teacher = {
      id,
      userId: 'u-' + id,
      name: newTeacher.name,
      username: newTeacher.username,
      password: newTeacher.password.trim() || 'teacher123',
      subject: newTeacher.subject,
      assignedClass: newTeacher.assignedClass,
      assignedSection: newTeacher.assignedSection,
      phone: newTeacher.phone,
      email: newTeacher.email
    };
    setTeachers(prev => [tempTeacher, ...prev]);
    setShowTeacherModal(false);
    setNewTeacher({ name: '', username: '', password: '', subject: 'Mathematics', assignedClass: '10', assignedSection: 'A', phone: '', email: '' });
    
    try {
      await api.createTeacher({
        ...newTeacher,
        password: newTeacher.password.trim() || 'teacher123'
      });
      loadAdminData();
    } catch (err) {
      console.error('Failed to create teacher:', err);
      loadAdminData();
    }
  };

  const handleUpdateTeacherPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher && editTeacherPassword) {
      const pwd = editTeacherPassword.trim();
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, password: pwd } : t));
      setEditingTeacher(null);
      setEditTeacherPassword('');
      try {
        await api.updateTeacher(editingTeacher.id, { password: pwd });
        loadAdminData();
      } catch (err) {
        console.error('Failed to update teacher password:', err);
        loadAdminData();
      }
    }
  };

  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherProfile) return;
    try {
      setTeachers(prev => prev.map(t => t.id === editingTeacherProfile.id ? editingTeacherProfile : t));
      const targetId = editingTeacherProfile.id;
      const profileData = { ...editingTeacherProfile };
      setEditingTeacherProfile(null);
      await api.updateTeacher(targetId, profileData);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update teacher profile:', err);
      loadAdminData();
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher account?')) {
      setTeachers(prev => prev.filter(t => t.id !== id));
      try {
        await api.deleteTeacher(id);
        loadAdminData();
      } catch (err) {
        console.error('Failed to delete teacher:', err);
        loadAdminData();
      }
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const stId = 's-' + Date.now();
    const tempStudent: Student = {
      id: stId,
      userId: 'u-' + stId,
      name: newStudent.name,
      rollNo: newStudent.rollNo || 'ST-' + Math.floor(1000 + Math.random() * 9000),
      class: newStudent.class,
      section: newStudent.section,
      parentName: newStudent.parentName,
      phone: newStudent.phone,
      email: newStudent.email,
      address: newStudent.address,
      admissionDate: new Date().toISOString().split('T')[0],
      feeInfo: {
        totalAnnual: 25100,
        paid: (newStudent.annualFeeFree ? 2500 : 0) + (newStudent.examFeeFree ? 1200 : 0) + (newStudent.admissionFeeFree ? 3000 : 0),
        pending: Number(newStudent.feePending || 0),
        annualFeeStatus: newStudent.annualFeeFree ? 'Exempt' : 'Unpaid',
        admissionFeeStatus: newStudent.admissionFeeFree ? 'Exempt' : 'Unpaid',
        examFeeStatus: newStudent.examFeeFree ? 'Exempt' : 'Unpaid',
        annualFeeAmount: 2500,
        admissionFeeAmount: 3000,
        examFeeAmount: 1200,
        months: [
          { month: 'April, 2026', status: 'Pending', amount: 1100 },
          { month: 'May, 2026', status: 'Pending', amount: 1100 },
          { month: 'June, 2026', status: 'Pending', amount: 1100 },
          { month: 'July, 2026', status: 'Pending', amount: 1100 },
          { month: 'August, 2026', status: 'Pending', amount: 1100 },
          { month: 'September, 2026', status: 'Pending', amount: 1100 },
          { month: 'October, 2026', status: 'Pending', amount: 1100 },
          { month: 'November, 2026', status: 'Pending', amount: 1100 },
          { month: 'December, 2026', status: 'Pending', amount: 1100 },
          { month: 'January, 2027', status: 'Pending', amount: 1100 },
          { month: 'February, 2027', status: 'Pending', amount: 1100 },
          { month: 'March, 2027', status: 'Pending', amount: 1100 }
        ]
      },
      addons: {
        hostel: { enabled: newStudent.hostelAddon, amount: newStudent.hostelAddon ? newStudent.hostelAmount : 0 },
        transportation: { enabled: newStudent.transportAddon, amount: newStudent.transportAddon ? newStudent.transportAmount : 0 }
      }
    };
    setStudents(prev => [tempStudent, ...prev]);
    setShowStudentModal(false);
    setNewStudent({ name: '', rollNo: '', class: '10', section: 'A', parentName: '', phone: '', email: '', address: 'Sikta, West Champaran', feePending: 3500, annualFeeFree: false, admissionFeeFree: false, examFeeFree: false, hostelAddon: false, hostelAmount: 5000, transportAddon: false, transportAmount: 750 });
    
    try {
      await api.createStudent(tempStudent);
      loadAdminData();
    } catch (err) {
      console.error('Failed to create student:', err);
      loadAdminData();
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Delete this student profile?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      try {
        await api.deleteStudent(id);
        loadAdminData();
      } catch (err) {
        console.error('Failed to delete student:', err);
        loadAdminData();
      }
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempNotice: Notice = {
      id: 'n-' + Date.now(),
      title: newNotice.title,
      content: newNotice.content,
      date: new Date().toISOString().split('T')[0],
      category: newNotice.category,
      targetClass: newNotice.targetClass,
      isUrgentTicker: newNotice.isUrgentTicker
    };
    setNotices(prev => [tempNotice, ...prev]);
    setShowNoticeModal(false);
    setNewNotice({ title: '', content: '', category: 'Urgent', targetClass: 'All', isUrgentTicker: true });
    setTimeout(() => window.dispatchEvent(new Event('mps_settings_updated')), 0);

    try {
      await api.createNotice(newNotice);
      loadAdminData();
    } catch (err) {
      console.error('Failed to create notice:', err);
      loadAdminData();
    }
  };

  const handleDeleteNotice = async (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    setTimeout(() => window.dispatchEvent(new Event('mps_settings_updated')), 0);
    try {
      await api.deleteNotice(id);
      loadAdminData();
    } catch (err) {
      console.error('Failed to delete notice:', err);
      loadAdminData();
    }
  };

  const handleUpdateAdmissionStatus = async (id: string, status: string) => {
    setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    try {
      await api.updateAdmissionStatus(id, status);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update admission status:', err);
      loadAdminData();
    }
  };

  const handleDeleteAdmission = async (id: string) => {
    setAdmissions(prev => prev.filter(a => a.id !== id));
    try {
      await api.deleteAdmission(id);
      loadAdminData();
    } catch (err) {
      console.error('Failed to delete admission:', err);
      loadAdminData();
    }
  };

  const handleAdmitCandidate = async (adm: AdmissionApplication) => {
    const rollNo = 'ST-' + Math.floor(1000 + Math.random() * 9000);
    const cls = adm.targetClass.replace(/\D/g, '') || '1';
    setAdmissions(prev => prev.map(a => a.id === adm.id ? { ...a, status: 'Approved' } : a));
    
    try {
      await api.createStudent({
        name: adm.studentName,
        rollNo: rollNo,
        class: cls,
        section: 'A',
        parentName: adm.parentName,
        phone: adm.phone,
        address: 'Sikta, West Champaran',
        feeInfo: {
          totalAnnual: 25100,
          paid: 0,
          pending: 25100,
          months: [{ month: 'Admission Fee', status: 'Pending', amount: 3500 }]
        }
      });
      await api.updateAdmissionStatus(adm.id, 'Approved');
      loadAdminData();
    } catch (err) {
      console.error('Failed to admit candidate:', err);
      loadAdminData();
    }
  };

  // If not logged in as Admin, show high-security Login card
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 p-2 text-slate-950 flex items-center justify-center mx-auto shadow-2xl ring-4 ring-amber-400/30 overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="MPS Logo" className="w-full h-full object-contain" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-amber-500" />
              )}
            </div>
            <h2 className="text-3xl font-black text-white font-heading">
              Admin Master Control Center
            </h2>
            <p className="text-xs text-slate-400">
              Model Public School (MPS Sikta) - CBSE Affiliation No: 330854
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-5">
            {loginError && (
              <div className="p-3 bg-rose-950/80 text-rose-300 text-xs rounded-2xl border border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="Enter admin username"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Master Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {captchaRequired && (
                  <CaptchaWidget
                    onVerify={token => setCaptchaToken(token)}
                    isVerified={!!captchaToken}
                  />
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  {loginLoading ? 'Authenticating Credentials...' : 'Sign In To Admin Control Center'}
                </button>
              </form>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredTeachers = teachers.filter(
    t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
         t.subject.toLowerCase().includes(teacherSearch.toLowerCase()) ||
         t.username.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredStudents = students.filter(
    s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
         s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
         s.class.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredAdmissions = admissions.filter(
    a => admissionFilter === 'All' ? true : a.status === admissionFilter
  );

  const filteredFeeStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(feeSearch.toLowerCase()) ||
      s.class.toLowerCase().includes(feeSearch.toLowerCase()) ||
      s.parentName.toLowerCase().includes(feeSearch.toLowerCase());
    const matchesClass = feeClassFilter === 'All' || s.class === feeClassFilter;
    return matchesSearch && matchesClass;
  });

  const totalFeeCollected = students.reduce((sum, s) => sum + (s.feeInfo?.paid || 0), 0);
  const totalFeePending = students.reduce((sum, s) => sum + (s.feeInfo?.pending || 0), 0);

  const toggleAdminFeeStatus = async (st: Student, status: 'Paid' | 'Pending') => {
    const totalAnnual = st.feeInfo?.totalAnnual || 25100;
    const updated = {
      ...st,
      feeInfo: {
        ...st.feeInfo,
        paid: status === 'Paid' ? totalAnnual : 0,
        pending: status === 'Paid' ? 0 : totalAnnual
      }
    };
    setStudents(prev => prev.map(s => s.id === st.id ? updated : s));
    try {
      await api.updateStudent(st.id, updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStudentAddon = async (st: Student, addonType: 'hostel' | 'transportation', enabled: boolean, amount: number) => {
    const updatedAddons = {
      ...(st.addons || {}),
      [addonType]: { enabled, amount }
    };
    const updated = { ...st, addons: updatedAddons };
    setStudents(prev => prev.map(s => s.id === st.id ? updated : s));
    try {
      await api.updateStudent(st.id, updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGlobalSearchNavigate = (tab: AdminTabType, filterText?: string) => {
    setActiveTab(tab);
    if (filterText) {
      if (tab === 'students') setStudentSearch(filterText);
      if (tab === 'teachers') setTeacherSearch(filterText);
      if (tab === 'fees') setFeeSearch(filterText);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION DRAWER (Exact look as user image) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-[#0b182e] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-cyan-400 p-1 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <School className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base leading-tight font-heading">
                {settings?.school_name || 'Model Public School'}
              </h2>
              <p className="text-[10px] text-cyan-400 font-medium tracking-wide">
                CBSE Affiliation: {settings?.cbse_affiliation || '330854'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Menu Options */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto font-bold text-sm">
          {/* Site Content */}
          <button
            onClick={() => { setActiveTab('site_content'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'site_content'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Palette className="w-5 h-5 flex-shrink-0" />
            <span>Site Content</span>
          </button>

          {/* Teachers */}
          <button
            onClick={() => { setActiveTab('teachers'); setIsSidebarOpen(false); }}
            onMouseEnter={api.prefetchTeachers}
            onFocus={api.prefetchTeachers}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'teachers'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Teachers</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">
                {teachers.length}
              </span>
            </div>
          </button>

          {/* Students */}
          <button
            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
            onMouseEnter={() => api.prefetchStudents()}
            onFocus={() => api.prefetchStudents()}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'students'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <GraduationCap className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Students</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">
                {students.length}
              </span>
            </div>
          </button>

          {/* All Classes Fee Management */}
          <button
            onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'fees'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Fee Management</span>
              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-extrabold">
                All Classes
              </span>
            </div>
          </button>

          {/* Online Classes */}
          <button
            onClick={() => { setActiveTab('online_classes'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'online_classes'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Video className="w-5 h-5 flex-shrink-0 text-indigo-400" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Online Classes</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">
                {adminOnlineClasses.length}
              </span>
            </div>
          </button>

          {/* Online Exams */}
          <button
            onClick={() => { setActiveTab('online_exams'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'online_exams'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileQuestion className="w-5 h-5 flex-shrink-0 text-purple-400" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Online Exams</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">
                {adminOnlineExams.length}
              </span>
            </div>
          </button>

          {/* Notices */}
          <button
            onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}
            onMouseEnter={api.prefetchNotices}
            onFocus={api.prefetchNotices}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'notices'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Megaphone className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Notices</span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-extrabold">
                {notices.length}
              </span>
            </div>
          </button>

          {/* Admissions */}
          <button
            onClick={() => { setActiveTab('admissions'); setIsSidebarOpen(false); }}
            onMouseEnter={api.prefetchAdmissions}
            onFocus={api.prefetchAdmissions}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'admissions'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Admissions</span>
              {admissions.filter(a => a.status === 'Pending').length > 0 && (
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  {admissions.filter(a => a.status === 'Pending').length} NEW
                </span>
              )}
            </div>
          </button>

          {/* Gallery & Events */}
          <button
            onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'gallery'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Image className="w-5 h-5 flex-shrink-0" />
            <span>Gallery & Events</span>
          </button>

          {/* Account */}
          <button
            onClick={() => { setActiveTab('account'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeTab === 'account'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Account</span>
          </button>

          <hr className="border-slate-800 my-4" />

          {/* Public Site */}
          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span>Public Site</span>
          </a>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-all text-left"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="bg-[#0b182e] border-b border-slate-800 p-4 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700"
              title="Toggle Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg font-black text-white font-heading capitalize flex items-center gap-2">
                {activeTab === 'site_content' && '🎨 Site Content'}
                {activeTab === 'teachers' && '👥 Teachers'}
                {activeTab === 'students' && '🎓 Students'}
                {activeTab === 'notices' && '📢 Notices'}
                {activeTab === 'admissions' && '📋 Admissions'}
                {activeTab === 'gallery' && '🖼️ Gallery'}
                {activeTab === 'account' && '⚙️ Account'}
              </h1>
            </div>
          </div>

          {/* Central Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <AdminGlobalSearch
              students={students}
              teachers={teachers}
              admissions={admissions}
              notices={notices}
              onlineClasses={adminOnlineClasses}
              onlineExams={adminOnlineExams}
              onNavigateTab={handleGlobalSearchNavigate}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                isEditMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-4 h-4" /> Live Website Edit: {isEditMode ? 'ON' : 'OFF'}
            </button>

            <a
              href="/api/export-sql"
              target="_blank"
              className="hidden sm:flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow"
            >
              <Download className="w-4 h-4" /> SQL Dump
            </a>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* TAB 1: SITE CONTENT */}
          {activeTab === 'site_content' && <WebsiteCMSManager />}

          {/* TAB 2: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-heading">
                      Faculty & Teacher Profiles ({teachers.length})
                    </h3>
                    <p className="text-xs text-slate-400">Manage class teachers, login credentials, and subject assignments</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search teachers..."
                        value={teacherSearch}
                        onChange={e => setTeacherSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    <button
                      onClick={() => setShowTeacherModal(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4" /> Add Teacher
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-300 font-extrabold uppercase">
                      <tr>
                        <th className="p-3.5">Teacher Name</th>
                        <th className="p-3.5">Username</th>
                        <th className="p-3.5">Password</th>
                        <th className="p-3.5">Class & Section</th>
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5">Phone</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
                      {filteredTeachers.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                              {t.name.charAt(0)}
                            </div>
                            {t.name}
                          </td>
                          <td className="p-3.5 text-amber-400 font-bold">{t.username}</td>
                          <td className="p-3.5 font-mono text-slate-300">
                            <span className="bg-slate-800 px-2 py-1 rounded-md border border-slate-700 text-[11px]">
                              {t.password || 'teacher123'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold">Class {t.assignedClass}-{t.assignedSection}</td>
                          <td className="p-3.5">{t.subject}</td>
                          <td className="p-3.5">{t.phone}</td>
                          <td className="p-3.5 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingTeacherProfile(t)}
                              className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                              title="Edit Full Teacher Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                            </button>
                            <button
                              onClick={() => {
                                setEditingTeacher(t);
                                setEditTeacherPassword(t.password || 'teacher123');
                              }}
                              className="p-2 bg-slate-800 text-amber-400 hover:bg-slate-700 rounded-xl transition-colors"
                              title="Reset / Edit Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(t.id)}
                              className="p-2 bg-rose-950/60 text-rose-400 hover:bg-rose-900 rounded-xl transition-colors"
                              title="Delete Teacher Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-heading">
                      Enrolled Student Database ({students.length})
                    </h3>
                    <p className="text-xs text-slate-400">Search student profiles, roll numbers, and fee details</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    <button
                      onClick={() => setShowStudentModal(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Student
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-300 font-extrabold uppercase">
                      <tr>
                        <th className="p-3.5">Roll No</th>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Class & Sec</th>
                        <th className="p-3.5">Parent Name</th>
                        <th className="p-3.5">Phone</th>
                        <th className="p-3.5">Fee Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-amber-400">{s.rollNo}</td>
                          <td className="p-3.5 font-bold text-white">{s.name}</td>
                          <td className="p-3.5 font-bold">Class {s.class}-{s.section}</td>
                          <td className="p-3.5">{s.parentName}</td>
                          <td className="p-3.5">{s.phone}</td>
                          <td className="p-3.5">
                            {s.feeInfo?.pending > 0 ? (
                              <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                                Pending ₹{s.feeInfo.pending}
                              </span>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                                Fee Clear
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-2 bg-rose-950/60 text-rose-400 hover:bg-rose-900 rounded-xl transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3.5: ALL CLASSES FEE MANAGEMENT & FINANCIAL SYSTEM */}
          {activeTab === 'fees' && (
            <SchoolFinanceSystem
              students={students}
              teachers={teachers}
              settings={settings}
              onUpdateStudent={s => setStudents(prev => prev.map(p => p.id === s.id ? s : p))}
            />
          )}

          {/* TAB 4: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              {/* TOP BANNER QUICK CUSTOMIZER CARD */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">Top Website Announcement Banner</h4>
                      <p className="text-xs text-slate-400">Controls the marquee headline bar appearing at the very top of all public pages</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = settings?.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: true,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: {
                            ...current,
                            enabled: !(current.enabled ?? true)
                          }
                        });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                        (settings?.notice_banner?.enabled ?? true)
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {(settings?.notice_banner?.enabled ?? true) ? '● Banner Visible' : '○ Banner Hidden'}
                    </button>
                  </div>
                </div>

                {/* Quick Banner Config Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={settings?.notice_banner?.badgeText || 'Notice'}
                      onChange={e => {
                        const current = settings?.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: true,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: { ...current, badgeText: e.target.value }
                        });
                      }}
                      className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Content Mode</label>
                    <select
                      value={(settings?.notice_banner?.useLiveNotices ?? true) ? 'live' : 'custom'}
                      onChange={e => {
                        const current = settings?.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: true,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: { ...current, useLiveNotices: e.target.value === 'live' }
                        });
                      }}
                      className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs"
                    >
                      <option value="live">🌊 Stream Active Ticker Notices</option>
                      <option value="custom">✍️ Fixed Custom Text</option>
                    </select>
                  </div>

                  {!(settings?.notice_banner?.useLiveNotices ?? true) && (
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Custom Message</label>
                      <input
                        type="text"
                        value={settings?.notice_banner?.customText || ''}
                        onChange={e => {
                          const current = settings?.notice_banner || {
                            enabled: true,
                            badgeText: 'Notice',
                            badgeColor: 'rose',
                            useLiveNotices: false,
                            customText: '',
                            isMarquee: true,
                            speed: 'normal'
                          };
                          updateSettings({
                            notice_banner: { ...current, customText: e.target.value }
                          });
                        }}
                        placeholder="Type custom banner message..."
                        className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* NOTICE BOARD TABLE */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-heading">
                      Urgent Notice Board & Ticker Control
                    </h3>
                    <p className="text-xs text-slate-400">Broadcast urgent announcements to students and parents</p>
                  </div>

                  <button
                    onClick={() => setShowNoticeModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Broadcast Notice
                  </button>
                </div>

                <div className="space-y-3">
                  {notices.map(n => (
                    <div
                      key={n.id}
                      className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-amber-400 uppercase bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-lg text-[10px]">
                            {n.category}
                          </span>
                          {n.isUrgentTicker && (
                            <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full animate-pulse">
                              LIVE TICKER ACTIVE
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">Target: Class {n.targetClass || 'All'}</span>
                          <span className="text-[11px] text-slate-500">• {n.date}</span>
                        </div>

                        <h4 className="font-extrabold text-white text-base truncate">{n.title}</h4>
                        <p className="text-slate-300 leading-relaxed line-clamp-2">{n.content}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* 1-Click Ticker Toggle */}
                        <button
                          type="button"
                          onClick={async () => {
                            const newStatus = !n.isUrgentTicker;
                            setNotices(prev => prev.map(item => item.id === n.id ? { ...item, isUrgentTicker: newStatus } : item));
                            await api.updateNotice(n.id, { isUrgentTicker: newStatus });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                            n.isUrgentTicker
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-600 hover:bg-rose-500/30'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          {n.isUrgentTicker ? 'Ticker Active' : 'Enable on Ticker'}
                        </button>

                        <button
                          onClick={() => setEditingNotice(n)}
                          className="p-2 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-xl transition-colors"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="p-2 bg-rose-950/60 text-rose-400 hover:bg-rose-900 rounded-xl transition-colors"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADMISSIONS */}
          {activeTab === 'admissions' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-heading">
                      Online Admission Inquiries ({admissions.length})
                    </h3>
                    <p className="text-xs text-slate-400">Review parent admission requests, approve or reject applications</p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                    {(['All', 'Pending', 'Contacted', 'Approved', 'Rejected'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setAdmissionFilter(st)}
                        className={`px-3 py-1.5 rounded-xl transition-all ${
                          admissionFilter === st ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAdmissions.map(a => (
                    <div
                      key={a.id}
                      className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-amber-400 font-extrabold text-xs uppercase block">
                            Seeking: {a.targetClass}
                          </span>
                          <h4 className="text-base font-black text-white">{a.studentName}</h4>
                          <p className="text-slate-400 font-medium">Parent: {a.parentName}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            a.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            a.status === 'Rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            a.status === 'Contacted' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>

                      {a.message && (
                        <p className="p-3 bg-slate-900 rounded-xl text-slate-300 text-xs italic border border-slate-800">
                          "{a.message}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-700/60">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-amber-400" /> {a.phone}
                        </span>
                        <span>Date: {a.appliedDate}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        {a.status !== 'Approved' && (
                          <button
                            onClick={() => handleAdmitCandidate(a)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Enroll Student
                          </button>
                        )}

                        {a.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateAdmissionStatus(a.id, 'Contacted')}
                            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                          >
                            Mark Contacted
                          </button>
                        )}

                        {a.status !== 'Rejected' && (
                          <button
                            onClick={() => handleUpdateAdmissionStatus(a.id, 'Rejected')}
                            className="py-2 px-3 bg-rose-950 text-rose-300 hover:bg-rose-900 rounded-xl"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteAdmission(a.id)}
                          className="p-2 bg-slate-900 text-rose-400 hover:bg-rose-900 rounded-xl"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GALLERY & EVENTS */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <WebsiteCMSManager />
            </div>
          )}

          {/* TAB 7: ACCOUNT & SECURITY */}
          {/* Online Classes Tab */}
          {activeTab === 'online_classes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
                    <Video className="w-6 h-6 text-indigo-400" />
                    Centralized Zoom Online Classes Manager
                  </h3>
                  <p className="text-xs text-slate-400">Create, control, or delete Zoom live classes across all school grades and sections</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white">Schedule New Zoom Class</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!adminNewClass.title) return;
                    await api.createOnlineClass(adminNewClass);
                    setAdminNewClass({
                      class: '10', section: 'A', subject: 'Mathematics', title: '', teacherName: 'MPS Faculty',
                      startTime: '10:00 AM', endTime: '11:00 AM', zoomUrl: 'https://zoom.us/j/84920193821', passcode: 'MPS2026', meetingId: '849 2019 3821', status: 'Scheduled'
                    });
                    loadAdminData();
                  }} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Class</label>
                        <input type="text" value={adminNewClass.class} onChange={e => setAdminNewClass({ ...adminNewClass, class: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Section</label>
                        <input type="text" value={adminNewClass.section} onChange={e => setAdminNewClass({ ...adminNewClass, section: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subject</label>
                      <input type="text" value={adminNewClass.subject} onChange={e => setAdminNewClass({ ...adminNewClass, subject: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Lecture Topic / Title</label>
                      <input type="text" required value={adminNewClass.title} onChange={e => setAdminNewClass({ ...adminNewClass, title: e.target.value })} placeholder="e.g. Real Numbers Live Lecture" className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Instructor Name</label>
                      <input type="text" value={adminNewClass.teacherName} onChange={e => setAdminNewClass({ ...adminNewClass, teacherName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Zoom Meeting Link</label>
                      <input type="url" required value={adminNewClass.zoomUrl} onChange={e => setAdminNewClass({ ...adminNewClass, zoomUrl: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-indigo-500/50 text-white font-mono" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl shadow">Publish Live Class</button>
                  </form>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-sm font-bold text-white">Active / Scheduled Classes ({adminOnlineClasses.length})</h4>
                  {adminOnlineClasses.map(oc => (
                    <div key={oc.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-bold">{oc.subject} (Class {oc.class}-{oc.section})</span>
                          <span className="text-slate-400">{oc.startTime} - {oc.endTime}</span>
                        </div>
                        <h5 className="font-bold text-white mt-1">{oc.title}</h5>
                        <p className="text-slate-500">Teacher: {oc.teacherName}</p>
                      </div>
                      <button onClick={async () => { await api.deleteOnlineClass(oc.id); loadAdminData(); }} className="text-rose-400 hover:text-rose-300 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Online Exams Tab */}
          {activeTab === 'online_exams' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
                  <FileQuestion className="w-6 h-6 text-purple-400" />
                  Online Examinations & Proctoring Control
                </h3>
                <p className="text-xs text-slate-400">Schedule proctored examinations with Zoom links across classes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white">Create Online Exam</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!adminNewExam.title) return;
                    await api.createOnlineExam({ ...adminNewExam, status: 'Upcoming' });
                    setAdminNewExam({
                      class: '10', section: 'A', subject: 'Science', title: '', date: new Date().toISOString().split('T')[0],
                      startTime: '10:00 AM', endTime: '12:00 PM', durationMinutes: 120, totalMarks: 100, zoomUrl: 'https://zoom.us/j/98123049182', instructions: '', status: 'Scheduled'
                    });
                    loadAdminData();
                  }} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">Class</label>
                        <input type="text" value={adminNewExam.class} onChange={e => setAdminNewExam({ ...adminNewExam, class: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Subject</label>
                        <input type="text" value={adminNewExam.subject} onChange={e => setAdminNewExam({ ...adminNewExam, subject: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Exam Title</label>
                      <input type="text" required value={adminNewExam.title} onChange={e => setAdminNewExam({ ...adminNewExam, title: e.target.value })} placeholder="e.g. Mid-Term Science Online Exam" className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Proctoring Zoom Link</label>
                      <input type="url" required value={adminNewExam.zoomUrl} onChange={e => setAdminNewExam({ ...adminNewExam, zoomUrl: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-purple-500/50 text-white font-mono" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow">Publish Exam</button>
                  </form>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-sm font-bold text-white">Scheduled Exams ({adminOnlineExams.length})</h4>
                  {adminOnlineExams.map(oe => (
                    <div key={oe.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-bold">{oe.subject} (Class {oe.class}-{oe.section})</span>
                        <h5 className="font-bold text-white mt-1">{oe.title}</h5>
                        <p className="text-slate-500">Date: {oe.date} | Duration: {oe.durationMinutes} mins | Total Marks: {oe.totalMarks}</p>
                      </div>
                      <button onClick={async () => { await api.deleteOnlineExam(oe.id); loadAdminData(); }} className="text-rose-400 hover:text-rose-300 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-black text-white font-heading flex items-center gap-2">
                    <Key className="w-6 h-6 text-amber-400" />
                    Admin Master Security Credentials
                  </h3>
                  <p className="text-xs text-slate-400">Update master admin password and username</p>
                </div>

                {securityMsg.text && (
                  <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                    securityMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}>
                    {securityMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangeAdminSecurity} className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Current Master Password *</label>
                    <input
                      type="password"
                      required
                      value={securityForm.currentPassword}
                      onChange={e => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      placeholder="Enter current master password"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">New Admin Username (Optional)</label>
                    <input
                      type="text"
                      value={securityForm.newUsername}
                      onChange={e => setSecurityForm({ ...securityForm, newUsername: e.target.value })}
                      placeholder="admin"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">New Master Password *</label>
                    <input
                      type="password"
                      required
                      value={securityForm.newPassword}
                      onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      placeholder="Enter new master password"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Registered Email Address (Optional)</label>
                    <input
                      type="email"
                      value={securityForm.newEmail}
                      onChange={e => setSecurityForm({ ...securityForm, newEmail: e.target.value })}
                      placeholder="admin@modelpublicschool.com"
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Registered Mobile Number for Firebase Phone Auth</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-900 text-amber-400 text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="text"
                        value={securityForm.newPhone}
                        onChange={e => setSecurityForm({ ...securityForm, newPhone: e.target.value })}
                        placeholder="Enter mobile number"
                        className="w-full p-3 rounded-r-xl border border-slate-700 bg-slate-800 text-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-transform hover:scale-[1.01]"
                  >
                    Update Admin Security Credentials
                  </button>
                </form>

                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Multi-Factor Authentication (MFA)
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Enhance your admin account security by requiring an SMS verification code during sign in.
                  </p>
                  <div className="flex items-center justify-between p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <div>
                      <span className="block text-xs font-bold text-white">Enable Multi-Factor Auth (MFA)</span>
                      <span className="text-[11px] text-slate-400">Status: {mfaEnabled ? 'Enabled (High Security)' : 'Disabled'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleMFA(!mfaEnabled)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        mfaEnabled ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD TEACHER */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-lg font-black font-heading text-white">Create New Teacher Account</h3>
            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="e.g. Sharma Sir"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Username *</label>
                <input
                  type="text"
                  required
                  value={newTeacher.username}
                  onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })}
                  placeholder="teacher1"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Teacher Login Password *</label>
                <div className="relative">
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    value={newTeacher.password}
                    onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    placeholder="Enter teacher password (e.g. Teacher@2026)"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Set a unique secure password for teacher workspace login</p>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Subject *</label>
                <input
                  type="text"
                  required
                  value={newTeacher.subject}
                  onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                  placeholder="Mathematics"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Assigned Class</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.assignedClass}
                    onChange={e => setNewTeacher({ ...newTeacher, assignedClass: e.target.value })}
                    placeholder="10"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Section</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.assignedSection}
                    onChange={e => setNewTeacher({ ...newTeacher, assignedSection: e.target.value })}
                    placeholder="A"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="teacher1@modelpublicschool.com"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Phone</label>
                <input
                  type="tel"
                  value={newTeacher.phone}
                  onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  placeholder="+91 91620 24642"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET TEACHER PASSWORD */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black font-heading text-white">Reset Teacher Password</h3>
            </div>
            <p className="text-xs text-slate-400">
              Teacher: <strong className="text-white">{editingTeacher.name}</strong> ({editingTeacher.username})
            </p>

            <form onSubmit={handleUpdateTeacherPassword} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-slate-300 font-bold">New Password *</label>
                <input
                  type="text"
                  required
                  value={editTeacherPassword}
                  onChange={e => setEditTeacherPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER PROFILE */}
      {editingTeacherProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black font-heading text-white">Edit Teacher Profile</h3>
              </div>
              <button
                onClick={() => setEditingTeacherProfile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherProfile} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Teacher Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacherProfile.name}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Username *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacherProfile.username}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Subject *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacherProfile.subject}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Assigned Class *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacherProfile.assignedClass}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, assignedClass: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Section *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacherProfile.assignedSection}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, assignedSection: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingTeacherProfile.phone}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Email Address</label>
                  <input
                    type="email"
                    value={editingTeacherProfile.email || ''}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Account Password (Optional)</label>
                <input
                  type="text"
                  value={editingTeacherProfile.password || ''}
                  onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, password: e.target.value })}
                  placeholder="Leave as is or update password"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Profile Photo URL or Upload</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTeacherProfile.photo || ''}
                    onChange={e => setEditingTeacherProfile({ ...editingTeacherProfile, photo: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs"
                  />
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 flex-shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) {
                              const str = reader.result.toString();
                              setEditingTeacherProfile({ ...editingTeacherProfile, photo: str });
                              api.uploadFile(str, file.name).then(res => {
                                if (res?.url) {
                                  setEditingTeacherProfile(prev => prev ? { ...prev, photo: res.url } : null);
                                }
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {editingTeacherProfile.photo && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-800/60 p-2 rounded-xl border border-slate-700">
                    <img
                      src={editingTeacherProfile.photo}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border border-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 truncate">Photo Preview</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeacherProfile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-lg font-black font-heading text-white">Enroll New Student</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Roll Number</label>
                  <input
                    type="text"
                    value={newStudent.rollNo}
                    onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                    placeholder="Auto or e.g. 1005"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Class</label>
                  <input
                    type="text"
                    required
                    value={newStudent.class}
                    onChange={e => setNewStudent({ ...newStudent, class: e.target.value })}
                    placeholder="10"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="student1005@modelpublicschool.com"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Parent / Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={newStudent.parentName}
                  onChange={e => setNewStudent({ ...newStudent, parentName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newStudent.phone}
                  onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Pending Fee Amount (₹)</label>
                <input
                  type="number"
                  value={newStudent.feePending}
                  onChange={e => setNewStudent({ ...newStudent, feePending: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              {/* Fee Exemptions (Mark as Free) */}
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2 text-xs">
                <h4 className="font-bold text-slate-200 flex justify-between items-center text-[11px]">
                  <span>Special Fee Exemptions (Free / Waived)</span>
                  <span className="text-emerald-400 font-semibold">Marked as Paid / ₹0</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium text-[11px]">
                    <input
                      type="checkbox"
                      checked={newStudent.annualFeeFree}
                      onChange={e => setNewStudent({ ...newStudent, annualFeeFree: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Free Annual Fee
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium text-[11px]">
                    <input
                      type="checkbox"
                      checked={newStudent.admissionFeeFree}
                      onChange={e => setNewStudent({ ...newStudent, admissionFeeFree: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Free Admission Fee
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium text-[11px]">
                    <input
                      type="checkbox"
                      checked={newStudent.examFeeFree}
                      onChange={e => setNewStudent({ ...newStudent, examFeeFree: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Free Exam Fee
                  </label>
                </div>
              </div>

              {/* Fee Add-ons: Hostel & Transportation */}
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-3">
                <h4 className="font-bold text-white text-xs flex justify-between items-center">
                  <span>Optional Fee Add-ons</span>
                  <span className="text-[10px] text-amber-400">Hostel & Transport</span>
                </h4>

                {/* Hostel */}
                <div className="p-2.5 bg-slate-800 rounded-xl space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={newStudent.hostelAddon}
                      onChange={e => setNewStudent({ ...newStudent, hostelAddon: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>🏠 Hostel Add-on</span>
                  </label>
                  {newStudent.hostelAddon && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setNewStudent({ ...newStudent, hostelAmount: 5000 })}
                        className={`px-2 py-1 rounded-lg font-bold border text-[11px] ${
                          newStudent.hostelAmount === 5000 ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        Standard (₹5000)
                      </button>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] text-slate-400">Custom:</span>
                        <input
                          type="number"
                          value={newStudent.hostelAmount}
                          onChange={e => setNewStudent({ ...newStudent, hostelAmount: Number(e.target.value) })}
                          className="w-full p-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Transport */}
                <div className="p-2.5 bg-slate-800 rounded-xl space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={newStudent.transportAddon}
                      onChange={e => setNewStudent({ ...newStudent, transportAddon: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>🚌 Transportation Add-on</span>
                  </label>
                  {newStudent.transportAddon && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap gap-1">
                        {[750, 900, 1000, 1200, 1500].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setNewStudent({ ...newStudent, transportAmount: amt })}
                            className={`px-2 py-1 rounded-lg font-bold border text-[11px] ${
                              newStudent.transportAmount === amt ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Custom:</span>
                        <input
                          type="number"
                          value={newStudent.transportAmount}
                          onChange={e => setNewStudent({ ...newStudent, transportAmount: Number(e.target.value) })}
                          className="w-full p-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BROADCAST NOTICE */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-lg font-black font-heading text-white">Broadcast New Notice</h3>
            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Notice Headline Title *</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. School Holiday Notice"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Category</label>
                <select
                  value={newNotice.category}
                  onChange={e => setNewNotice({ ...newNotice, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="General">General</option>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Event">Event</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Notice Details / Content *</label>
                <textarea
                  rows={3}
                  required
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Type notice message here..."
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentTicker"
                  checked={newNotice.isUrgentTicker}
                  onChange={e => setNewNotice({ ...newNotice, isUrgentTicker: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-800"
                />
                <label htmlFor="urgentTicker" className="text-xs text-amber-400 font-bold cursor-pointer">
                  Show in Top Website Announcement Ticker
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT NOTICE */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black font-heading text-white">Edit Announcement Notice</h3>
              <button
                onClick={() => setEditingNotice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!editingNotice) return;
                setNotices(prev => prev.map(n => n.id === editingNotice.id ? editingNotice : n));
                await api.updateNotice(editingNotice.id, editingNotice);
                setEditingNotice(null);
              }}
              className="space-y-3 text-xs font-medium"
            >
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Notice Headline Title *</label>
                <input
                  type="text"
                  required
                  value={editingNotice.title}
                  onChange={e => setEditingNotice({ ...editingNotice, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Category</label>
                <select
                  value={editingNotice.category}
                  onChange={e => setEditingNotice({ ...editingNotice, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="General">General</option>
                  <option value="Exam">Exam</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Event">Event</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-300 font-bold">Notice Details / Content *</label>
                <textarea
                  rows={3}
                  required
                  value={editingNotice.content}
                  onChange={e => setEditingNotice({ ...editingNotice, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editUrgentTicker"
                  checked={editingNotice.isUrgentTicker}
                  onChange={e => setEditingNotice({ ...editingNotice, isUrgentTicker: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-800"
                />
                <label htmlFor="editUrgentTicker" className="text-xs text-amber-400 font-bold cursor-pointer">
                  Show in Top Website Announcement Ticker
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
