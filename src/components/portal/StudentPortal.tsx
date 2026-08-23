import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../lib/api';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { CountryPhoneInput, detectUserCountryCode, fetchUserCountryCodeFromIP } from '../common/CountryPhoneInput';
import {
  Student, Homework, AttendanceRecord, ExamResult, Notice,
  OnlineClass, OnlineExam, TimeTableSlot, StudyMaterial, SchoolDiaryEntry,
  SyllabusItem, TransportRoute, AdmitCard, StudentDeclaration, SchoolMessage, RecordUpdateReq
} from '../../types';
import { StudentIDCard } from '../common/StudentIDCard';
import { AIHomeworkTutor } from '../common/AIHomeworkTutor';
import { CaptchaWidget } from '../common/CaptchaWidget';
import { AcademicProgressAnalytics } from './AcademicProgressAnalytics';
import { downloadElementAsPDF } from '../../lib/pdf';
import { OfficialFeeReceipt } from '../common/OfficialFeeReceipt';
import {
  GraduationCap, LogOut, Calendar, BookOpen, FileText, IndianRupee, Bell, AlertTriangle, AlertCircle,
  CheckCircle2, XCircle, Clock, Award, ShieldCheck, Download, UserCheck, Key, User, Bot, Sparkles, TrendingUp, Printer, Check,
  Video, FileQuestion, BookMarked, Notebook, FileCode, Bus, CreditCard, FileCheck, MessageSquare, Edit3, ExternalLink, Home, Send
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { student, loginUser, logout, updateStudentState } = useAuth();
  const { settings } = useCMS();

  // Login Form state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => detectUserCountryCode());
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    let active = true;
    fetchUserCountryCodeFromIP().then(code => {
      if (active && code) {
        setSelectedCountryCode(code);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const [loginForm, setLoginForm] = useState({
    studentName: '',
    className: '',
    section: '',
    rollNo: '',
    phone: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Student Dashboard active tab
  type TabType =
    | 'online-classes'
    | 'online-exams'
    | 'timetable'
    | 'study-material'
    | 'school-diary'
    | 'syllabus'
    | 'transport'
    | 'admit-card'
    | 'declarations'
    | 'messages'
    | 'record-updates'
    | 'idcard'
    | 'attendance'
    | 'reportcard'
    | 'trends'
    | 'homework'
    | 'fees'
    | 'ai-tutor';

  const [activeTab, setActiveTab] = useState<TabType>('homework');
  const [selectedFeeMonth, setSelectedFeeMonth] = useState<string>('July, 2026');

  const activeContentRef = useRef<HTMLDivElement>(null);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    setTimeout(() => {
      if (activeContentRef.current) {
        activeContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Student Dashboard data states
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([]);
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>([]);
  const [timeTable, setTimeTable] = useState<TimeTableSlot[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [schoolDiary, setSchoolDiary] = useState<SchoolDiaryEntry[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [declarations, setDeclarations] = useState<StudentDeclaration[]>([]);
  const [schoolMessages, setSchoolMessages] = useState<SchoolMessage[]>([]);
  const [recordUpdates, setRecordUpdates] = useState<RecordUpdateReq[]>([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [autoJoinNotice, setAutoJoinNotice] = useState<string | null>(null);

  // Form states for student actions
  const [newMessage, setNewMessage] = useState({ subject: '', message: '' });
  const [messageSuccess, setMessageSuccess] = useState('');

  const [newUpdateReq, setNewUpdateReq] = useState({ field: 'Student Name', oldValue: '', newValue: '' });
  const [updateReqSuccess, setUpdateReqSuccess] = useState('');

  const loadStudentDashboardData = async (st: Student) => {
    setDataLoading(true);
    try {
      console.log('[StudentPortal] Loading live student dashboard data...');
      const freshStudent = await api.getStudent(st.id);
      if (freshStudent) {
        updateStudentState(freshStudent);
        st = freshStudent;
      }

      const [
        hw, att, exams, nots,
        oc, oe, tt, sm, sd, syl, tr, ac, dec, msgs, reqs
      ] = await Promise.all([
        api.getHomework(st.class, st.section),
        api.getAttendance(st.id),
        api.getExamResults(st.id),
        api.getNotices(),
        api.getOnlineClasses(st.class, st.section),
        api.getOnlineExams(st.class, st.section),
        api.getTimeTable(st.class, st.section),
        api.getStudyMaterial(st.class, st.section),
        api.getSchoolDiary(st.class, st.section),
        api.getSyllabus(st.class, st.section),
        api.getTransport(),
        api.getAdmitCards(st.id),
        api.getDeclarations(),
        api.getSchoolMessages(st.id, st.class, st.section),
        api.getRecordUpdates(st.id)
      ]);

      const cleanStr = (v?: string) => String(v || '').replace(/^class/i, '').trim().toLowerCase();
      const matchClassSec = (itemClass?: string, itemSec?: string) => {
        const matchC = !itemClass || itemClass === 'All' || cleanStr(itemClass) === cleanStr(st.class);
        const matchS = !itemSec || itemSec === 'All' || cleanStr(itemSec) === cleanStr(st.section);
        return matchC && matchS;
      };

      setHomeworkList(hw.filter(h => matchClassSec(h.class, h.section)));
      setAttendanceRecords(att);
      setExamResults(exams);
      setNotices(nots);

      setOnlineClasses(oc.filter(c => matchClassSec(c.class, c.section)));
      setOnlineExams(oe.filter(e => matchClassSec(e.class, e.section)));
      setTimeTable(tt.filter(t => matchClassSec(t.class, t.section)));
      setStudyMaterials(sm.filter(m => matchClassSec(m.class, m.section)));
      setSchoolDiary(sd.filter(d => matchClassSec(d.class, d.section)));
      setSyllabus(syl.filter(s => matchClassSec(s.class, s.section)));
      setTransportRoutes(tr);
      setAdmitCards(ac);
      setDeclarations(dec);
      setSchoolMessages(msgs.filter(m => matchClassSec(m.class, m.section)));
      setRecordUpdates(reqs);
    } catch (e) {
      console.error('Error loading student dashboard data:', e);
    } finally {
      setDataLoading(false);
    }
  };

  // Global Realtime Refresh hook subscribing to student-related Supabase topics
  const studentTopics = [
    'public:students',
    'public:homework',
    'public:attendance',
    'public:exam_results',
    'public:notice_board',
    'public:online_classes',
    'public:fee_records',
    'public:site_settings'
  ] as const;

  const { refreshCount } = useSupabaseRealtimeRefresh(
    studentTopics,
    useCallback((event) => {
      if (student) {
        console.log(`[StudentPortal] Realtime broadcast on ${event.topic} received -> refreshing dashboard tables`);
        loadStudentDashboardData(student);
      }
    }, [student]),
    Boolean(student)
  );

  useEffect(() => {
    if (student) {
      loadStudentDashboardData(student);
    }
  }, [student, refreshCount]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const cleanDigits = loginForm.phone.replace(/\D/g, '');
      const fullPhone = `${selectedCountryCode}${cleanDigits}`;

      const res = await api.login({
        role: 'student',
        studentName: loginForm.studentName.trim(),
        className: loginForm.className.trim(),
        section: loginForm.section.trim(),
        rollNo: loginForm.rollNo.trim(),
        phone: fullPhone,
        password: loginForm.password.trim(),
        captchaToken: captchaToken || undefined
      });

      if (res.success && res.student) {
        loginUser({ user: res.user, student: res.student });
      } else {
        setLoginError(res.message || 'Invalid student credentials. Please verify your details.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate. Please verify your credentials and connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Auto Zoom Join Handler
  const handleAutoJoinZoom = (title: string, subject: string, zoomUrl: string, passcode?: string) => {
    setAutoJoinNotice(`Launching Zoom for ${subject} (${title}). Opening meeting link automatically...`);
    if (passcode) {
      try {
        navigator.clipboard.writeText(passcode);
      } catch (e) {
        // clipboard fallback
      }
    }
    setTimeout(() => {
      window.open(zoomUrl, '_blank');
      setTimeout(() => setAutoJoinNotice(null), 5000);
    }, 1200);
  };

  // Submit School Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newMessage.message) return;
    try {
      const res = await api.createSchoolMessage({
        studentId: student.id,
        studentName: student.name,
        class: `${student.class}-${student.section}`,
        subject: newMessage.subject || 'General Inquiry',
        message: newMessage.message
      });
      if (res.success) {
        setMessageSuccess('Your message has been sent to school administration successfully!');
        setNewMessage({ subject: '', message: '' });
        const updated = await api.getSchoolMessages(student.id);
        setSchoolMessages(updated);
        setTimeout(() => setMessageSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Record Update Request
  const handleSendUpdateReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !newUpdateReq.newValue) return;
    try {
      const res = await api.createRecordUpdate({
        studentId: student.id,
        studentName: student.name,
        field: newUpdateReq.field,
        oldValue: newUpdateReq.oldValue,
        newValue: newUpdateReq.newValue
      });
      if (res.success) {
        setUpdateReqSuccess('Record correction request submitted to school admin.');
        setNewUpdateReq({ field: 'Student Name', oldValue: '', newValue: '' });
        const updated = await api.getRecordUpdates(student.id);
        setRecordUpdates(updated);
        setTimeout(() => setUpdateReqSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Student Attendance Month & Filter States
  const [attendanceMonth, setAttendanceMonth] = useState<string>('2026-08');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('all');

  // Month Display mapping
  const attendanceMonthLabels: Record<string, string> = {
    '2026-08': 'August 2026',
    '2026-07': 'July 2026',
    '2026-06': 'June 2026',
    '2026-05': 'May 2026',
    '2026-04': 'April 2026',
    'all': 'Full Academic Session (Apr-Aug 2026)'
  };

  // Generate complete attendance timeline with "Not Mentioned" status for unrecorded days
  const processedAttendanceTimeline = useMemo(() => {
    if (!student) return [];
    const todayStr = '2026-08-21';
    const dates: string[] = [];

    if (attendanceMonth === 'all') {
      let curr = new Date('2026-04-01T00:00:00');
      const end = new Date(`${todayStr}T00:00:00`);
      while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      const [yStr, mStr] = attendanceMonth.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const totalDays = new Date(y, m, 0).getDate();
      for (let i = 1; i <= totalDays; i++) {
        const dStr = String(i).padStart(2, '0');
        dates.push(`${yStr}-${mStr}-${dStr}`);
      }
    }

    const result = dates.map(dateStr => {
      const existing = attendanceRecords.find(a => a.date === dateStr);
      const dateObj = new Date(`${dateStr}T00:00:00`);
      const isSunday = dateObj.getDay() === 0;
      const isFuture = dateStr > todayStr;

      if (existing) {
        return {
          ...existing,
          isAutoGenerated: false
        };
      }

      if (isSunday) {
        return {
          id: `gen-sun-${dateStr}`,
          studentId: student.id,
          class: student.class,
          section: student.section,
          date: dateStr,
          status: 'Holiday' as const,
          remarks: 'Official Weekly Sunday Holiday',
          isPublished: true,
          teacherName: 'School Calendar',
          isAutoGenerated: true
        };
      }

      if (isFuture) {
        return {
          id: `gen-fut-${dateStr}`,
          studentId: student.id,
          class: student.class,
          section: student.section,
          date: dateStr,
          status: 'Not Mentioned' as const,
          remarks: 'Scheduled Upcoming Working Day',
          isPublished: false,
          teacherName: 'Class Teacher',
          isAutoGenerated: true
        };
      }

      // Elapsed weekday where teacher has not input attendance yet
      return {
        id: `gen-unmarked-${dateStr}`,
        studentId: student.id,
        class: student.class,
        section: student.section,
        date: dateStr,
        status: 'Not Mentioned' as const,
        remarks: 'Attendance not input / not mentioned by class teacher for this date',
        isPublished: false,
        teacherName: 'Class Teacher',
        isAutoGenerated: true
      };
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, attendanceMonth, student]);

  // Active elapsed days for accurate metric computations
  const activeElapsedRecords = useMemo(() => {
    const todayStr = '2026-08-21';
    return processedAttendanceTimeline.filter(a => a.date <= todayStr);
  }, [processedAttendanceTimeline]);

  const totalRecordedDays = activeElapsedRecords.length;
  const holidayDays = activeElapsedRecords.filter(a => a.status === 'Holiday').length;
  const totalSchoolWorkingDays = Math.max(1, totalRecordedDays - holidayDays);

  const presentDays = activeElapsedRecords.filter(a => a.status === 'Present').length;
  const lateDays = activeElapsedRecords.filter(a => a.status === 'Late').length;
  const absentDays = activeElapsedRecords.filter(a => a.status === 'Absent').length;
  const leaveDays = activeElapsedRecords.filter(a => a.status === 'Leave').length;
  const notMentionedDays = activeElapsedRecords.filter(a => a.status === 'Not Mentioned').length;

  const markedWorkingDays = presentDays + lateDays + absentDays + leaveDays;
  const totalAttended = presentDays + lateDays;

  // Accurate Attendance Percentage based on marked working days
  const attendancePercentage = markedWorkingDays > 0 
    ? Number(((totalAttended / markedWorkingDays) * 100).toFixed(1)) 
    : 100;
  const workingDays = totalSchoolWorkingDays;

  // Filtered view for attendance table
  const displayedAttendanceList = useMemo(() => {
    if (attendanceStatusFilter === 'all') return processedAttendanceTimeline;
    if (attendanceStatusFilter === 'Present') return processedAttendanceTimeline.filter(a => a.status === 'Present' || a.status === 'Late');
    if (attendanceStatusFilter === 'Absent') return processedAttendanceTimeline.filter(a => a.status === 'Absent');
    if (attendanceStatusFilter === 'Not Mentioned') return processedAttendanceTimeline.filter(a => a.status === 'Not Mentioned');
    if (attendanceStatusFilter === 'Holiday') return processedAttendanceTimeline.filter(a => a.status === 'Holiday');
    if (attendanceStatusFilter === 'Leave') return processedAttendanceTimeline.filter(a => a.status === 'Leave');
    return processedAttendanceTimeline;
  }, [processedAttendanceTimeline, attendanceStatusFilter]);

  const handleDownloadFullDossier = () => {
    downloadElementAsPDF('student-full-dossier', `Student_Dossier_${student?.name.replace(/\s+/g, '_')}.pdf`);
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 p-2 text-white flex items-center justify-center mx-auto shadow-xl overflow-hidden ring-4 ring-amber-500/20">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="MPS Logo" className="w-full h-full object-contain" />
              ) : (
                <GraduationCap className="w-10 h-10 text-amber-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">
              Student & Parent Portal
            </h2>
            <p className="text-xs text-slate-400">
              Model Public School (MPS Sikta) - Student Access
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-950/80 text-rose-300 text-xs rounded-xl border border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  1. Student Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginForm.studentName}
                    onChange={e => setLoginForm({ ...loginForm, studentName: e.target.value })}
                    placeholder="Enter student full name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    2. Class
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.className}
                    onChange={e => setLoginForm({ ...loginForm, className: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    3. Section
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.section}
                    onChange={e => setLoginForm({ ...loginForm, section: e.target.value })}
                    placeholder="e.g. A"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    4. Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.rollNo}
                    onChange={e => setLoginForm({ ...loginForm, rollNo: e.target.value })}
                    placeholder="e.g. 1001"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    5. Mobile Number (Country Code + Number)
                  </label>
                  <CountryPhoneInput
                    value={loginForm.phone}
                    selectedCountryCode={selectedCountryCode}
                    onCountryCodeChange={setSelectedCountryCode}
                    onChange={(val, code) => {
                      setLoginForm({ ...loginForm, phone: val });
                      setSelectedCountryCode(code);
                    }}
                    required
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Unique Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal"
                  />
                </div>
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
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
              >
                {loginLoading ? 'Authenticating Credentials...' : 'Sign In To Student Portal'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                <Home className="w-4 h-4" /> Return to Website Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6" id="student-full-dossier">
        
        {/* Top Student Banner Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-amber-400/40 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <img
                  src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'}
                  alt={student.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-slate-800"
                />
                <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900 flex items-center gap-1 shadow">
                  <Check className="w-3 h-3" /> Active
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black font-heading text-white">{student.name}</h1>
                  <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                    Class {student.class}-{student.section}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-300 font-medium">
                  <span>Roll No: <strong className="text-white font-bold">{student.rollNo}</strong></span>
                  <span>•</span>
                  <span>Parent: <strong className="text-white font-bold">{student.parentName}</strong> ({student.phone})</span>
                </div>

                <p className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5 pt-0.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" /> Model Public School (MPS Sikta)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <a
                href="/"
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow transition-all"
              >
                <Home className="w-4 h-4 text-amber-400" /> Homepage
              </a>

              <button
                onClick={handleDownloadFullDossier}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow transition-all transform active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Complete Report (PDF)
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Auto Join Zoom Toast Notification */}
        {autoJoinNotice && (
          <div className="p-4 bg-emerald-500 text-slate-950 font-bold text-xs rounded-2xl flex items-center gap-3 shadow-lg animate-bounce">
            <Video className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span>{autoJoinNotice}</span>
          </div>
        )}

        {/* Student Notice Ticker Alert */}
        {student.notice && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300 font-medium">
            <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce" />
            <div>
              <strong className="font-bold">Special Notice For You:</strong> {student.notice}
            </div>
          </div>
        )}

        {/* All Portal Features Grid (Big Full-Sized Buttons - Daily Useful Tools First!) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Student & Parent Portal Workspace Tools
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">18 Full Features</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs font-bold">
            {/* 1. Homework */}
            <button
              onClick={() => handleSwitchTab('homework')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'homework'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === 'homework' ? 'text-slate-950' : 'text-blue-500'}`} />
              <span className="font-extrabold leading-tight">Homework</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'homework' ? 'bg-slate-900/20 text-slate-950' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
              }`}>
                {homeworkList.length} Tasks
              </span>
            </button>

            {/* 2. Attendance */}
            <button
              onClick={() => handleSwitchTab('attendance')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'attendance'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'attendance' ? 'text-slate-950' : 'text-emerald-500'}`} />
              <span className="font-extrabold leading-tight">Attendance</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'attendance' ? 'bg-slate-900/20 text-slate-950' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200'
              }`}>
                {attendancePercentage}% Record
              </span>
            </button>

            {/* 3. Fee */}
            <button
              onClick={() => handleSwitchTab('fees')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'fees'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <IndianRupee className={`w-5 h-5 ${activeTab === 'fees' ? 'text-slate-950' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="font-extrabold leading-tight">Fee</span>
              {student.feeInfo.pending > 0 || student.feeInfo.months?.some(m => m.status === 'Pending') ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                  <AlertCircle className="w-3 h-3" /> (!) UNPAID
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                  All Paid
                </span>
              )}
            </button>

            {/* 4. AI Homework Tutor */}
            <button
              onClick={() => handleSwitchTab('ai-tutor')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'ai-tutor'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Bot className={`w-5 h-5 ${activeTab === 'ai-tutor' ? 'text-slate-950' : 'text-amber-500 animate-pulse'}`} />
              <span className="font-extrabold leading-tight">AI Homework Tutor</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'ai-tutor' ? 'bg-slate-900/20 text-slate-950' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
              }`}>
                Instant Help
              </span>
            </button>

            {/* 5. Messages */}
            <button
              onClick={() => handleSwitchTab('messages')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'messages'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'text-slate-950' : 'text-sky-500'}`} />
              <span className="font-extrabold leading-tight">Messages</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'messages' ? 'bg-slate-900/20 text-slate-950' : 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
              }`}>
                {schoolMessages.length} Alerts
              </span>
            </button>

            {/* 6. Marksheets */}
            <button
              onClick={() => handleSwitchTab('reportcard')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'reportcard'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Award className={`w-5 h-5 ${activeTab === 'reportcard' ? 'text-slate-950' : 'text-amber-600'}`} />
              <span className="font-extrabold leading-tight">Marksheets</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'reportcard' ? 'bg-slate-900/20 text-slate-950' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
              }`}>
                Report Card
              </span>
            </button>

            {/* 7. Time Table */}
            <button
              onClick={() => handleSwitchTab('timetable')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'timetable'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Clock className={`w-5 h-5 ${activeTab === 'timetable' ? 'text-slate-950' : 'text-teal-500'}`} />
              <span className="font-extrabold leading-tight">Time Table</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'timetable' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Daily Routine
              </span>
            </button>

            {/* 8. Online Classes */}
            <button
              onClick={() => handleSwitchTab('online-classes')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'online-classes'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Video className={`w-5 h-5 ${activeTab === 'online-classes' ? 'text-slate-950' : 'text-indigo-500'}`} />
              <span className="font-extrabold leading-tight">Online Classes</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'online-classes' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                {onlineClasses.length} Scheduled
              </span>
            </button>

            {/* 9. Online Exams */}
            <button
              onClick={() => handleSwitchTab('online-exams')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'online-exams'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <FileQuestion className={`w-5 h-5 ${activeTab === 'online-exams' ? 'text-slate-950' : 'text-purple-500'}`} />
              <span className="font-extrabold leading-tight">Online Exams</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'online-exams' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                {onlineExams.length} Scheduled
              </span>
            </button>

            {/* 10. Study Material */}
            <button
              onClick={() => handleSwitchTab('study-material')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'study-material'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <BookMarked className={`w-5 h-5 ${activeTab === 'study-material' ? 'text-slate-950' : 'text-emerald-500'}`} />
              <span className="font-extrabold leading-tight">Study Material</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'study-material' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                {studyMaterials.length} PDFs
              </span>
            </button>

            {/* 11. School Diary */}
            <button
              onClick={() => handleSwitchTab('school-diary')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'school-diary'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Notebook className={`w-5 h-5 ${activeTab === 'school-diary' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="font-extrabold leading-tight">School Diary</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'school-diary' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Teacher Notes
              </span>
            </button>

            {/* 12. Course Syllabus */}
            <button
              onClick={() => handleSwitchTab('syllabus')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'syllabus'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <FileCode className={`w-5 h-5 ${activeTab === 'syllabus' ? 'text-slate-950' : 'text-teal-500'}`} />
              <span className="font-extrabold leading-tight">Course Syllabus</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'syllabus' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Curriculum
              </span>
            </button>

            {/* 13. School Transport */}
            <button
              onClick={() => handleSwitchTab('transport')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'transport'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Bus className={`w-5 h-5 ${activeTab === 'transport' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="font-extrabold leading-tight">School Transport</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'transport' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Bus Route
              </span>
            </button>

            {/* 14. Admit Card */}
            <button
              onClick={() => handleSwitchTab('admit-card')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'admit-card'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${activeTab === 'admit-card' ? 'text-slate-950' : 'text-rose-500'}`} />
              <span className="font-extrabold leading-tight">Admit Card</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'admit-card' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Exam Pass
              </span>
            </button>

            {/* 15. Declarations */}
            <button
              onClick={() => handleSwitchTab('declarations')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'declarations'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck className={`w-5 h-5 ${activeTab === 'declarations' ? 'text-slate-950' : 'text-indigo-500'}`} />
              <span className="font-extrabold leading-tight">Declarations</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'declarations' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Rules & Safety
              </span>
            </button>

            {/* 16. Corrections */}
            <button
              onClick={() => handleSwitchTab('record-updates')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'record-updates'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Edit3 className={`w-5 h-5 ${activeTab === 'record-updates' ? 'text-slate-950' : 'text-orange-500'}`} />
              <span className="font-extrabold leading-tight">Corrections</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'record-updates' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Edit Profile
              </span>
            </button>

            {/* 17. Digital ID Card */}
            <button
              onClick={() => handleSwitchTab('idcard')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'idcard'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${activeTab === 'idcard' ? 'text-slate-950' : 'text-emerald-500'}`} />
              <span className="font-extrabold leading-tight">Digital ID Card</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'idcard' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Identity
              </span>
            </button>

            {/* 18. Progress Trends */}
            <button
              onClick={() => handleSwitchTab('trends')}
              className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] ${
                activeTab === 'trends'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                  : 'bg-stone-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className={`w-5 h-5 ${activeTab === 'trends' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="font-extrabold leading-tight">Progress Trends</span>
              <span className={`text-[10px] font-semibold ${activeTab === 'trends' ? 'text-slate-900/80' : 'text-slate-500'}`}>
                Analytics
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Section Container with scroll target ref */}
        <div ref={activeContentRef} id="student-tab-content-section" className="scroll-mt-6 space-y-6">

        {/* --- TAB 1: ONLINE CLASSES --- */}
        {activeTab === 'online-classes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-500" /> Interactive Online Live Classes
                </h3>
                <p className="text-xs text-slate-500">
                  Class {student.class}-{student.section} schedule. Click "Join Live Class" to automatically launch Zoom.
                </p>
              </div>
            </div>

            {onlineClasses.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Video className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 font-heading">
                  No classes available
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no active or upcoming live classes scheduled for your class at this moment. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onlineClasses.map(oc => (
                  <div
                    key={oc.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-indigo-500/30 dark:border-indigo-500/20 shadow-md space-y-4 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Subject: {oc.subject}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        oc.status === 'Live'
                          ? 'bg-emerald-500 text-slate-950 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {oc.status === 'Live' ? '🔴 Live Now' : oc.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{oc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Instructor: <strong>{oc.teacherName}</strong></p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Time Slot:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{oc.startTime} - {oc.endTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Class & Section:</span>
                        <strong className="text-slate-800 dark:text-slate-200">Class {oc.class}-{oc.section}</strong>
                      </div>
                      {oc.meetingId && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Meeting ID:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{oc.meetingId}</strong>
                        </div>
                      )}
                      {oc.passcode && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Passcode:</span>
                          <strong className="text-amber-600 dark:text-amber-400 font-mono">{oc.passcode}</strong>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAutoJoinZoom(oc.title, oc.subject, oc.zoomUrl, oc.passcode)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Join Live Zoom Class Automatically <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: ONLINE EXAMS --- */}
        {activeTab === 'online-exams' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-purple-500" /> Online Examination Portal
                </h3>
                <p className="text-xs text-slate-500">
                  Proctored online exams & quizzes with automatic Zoom proctoring link.
                </p>
              </div>
            </div>

            {onlineExams.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 font-heading">
                  No exams available
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no scheduled online examinations for your class at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onlineExams.map(oe => (
                  <div
                    key={oe.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/20 shadow-md space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Subject: {oe.subject}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        oe.status === 'Live' ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {oe.status === 'Live' ? 'Exam In Progress' : oe.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{oe.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Duration: <strong>{oe.durationMinutes} Minutes</strong> | Total Marks: <strong>{oe.totalMarks}</strong></p>
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Exam Date:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{oe.date}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timing:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{oe.startTime} - {oe.endTime}</strong>
                      </div>
                      {oe.instructions && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          <strong>Instructions:</strong> {oe.instructions}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAutoJoinZoom(oe.title, oe.subject, oe.zoomUrl || oe.examUrl)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <FileQuestion className="w-4 h-4" /> Automatically Start Exam & Open Zoom <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: TIME TABLE --- */}
        {activeTab === 'timetable' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Class Weekly Routine Time Table
                </h3>
                <p className="text-xs text-slate-500">Official schedule for Class {student.class}-{student.section}</p>
              </div>
            </div>

            {timeTable.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No time table slots uploaded yet for your class.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">Day</th>
                      <th className="p-3">Time Slot</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Teacher</th>
                      <th className="p-3">Room / Venue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {timeTable.map(tt => (
                      <tr key={tt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{tt.day}</td>
                        <td className="p-3 font-medium">{tt.time}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{tt.subject}</td>
                        <td className="p-3">{tt.teacherName}</td>
                        <td className="p-3">{tt.roomNo || 'Classroom'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: STUDY MATERIAL --- */}
        {activeTab === 'study-material' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-500" /> Study Material & Question Banks
              </h3>
              <p className="text-xs text-slate-500">Downloadable chapter notes, formula sheets, and solved sample papers for Class {student.class}.</p>
            </div>

            {studyMaterials.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No study material uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyMaterials.map(sm => (
                  <div key={sm.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {sm.subject} • {sm.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{sm.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{sm.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{sm.description}</p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Uploaded by: {sm.uploadedBy}</span>
                      {sm.fileUrl && (
                        <a
                          href={sm.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" /> Download / Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 5: SCHOOL DIARY --- */}
        {activeTab === 'school-diary' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Notebook className="w-5 h-5 text-amber-500" /> Digital School Diary
              </h3>
              <p className="text-xs text-slate-500">Daily teacher remarks and class homework logs for Class {student.class}-{student.section}.</p>
            </div>

            {schoolDiary.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No diary entries logged today.
              </div>
            ) : (
              <div className="space-y-3">
                {schoolDiary.map(sd => (
                  <div key={sd.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {sd.subject}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{sd.date}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{sd.note}</p>
                    </div>
                    <div className="text-xs text-slate-500 flex-shrink-0">
                      Teacher: <strong className="text-slate-800 dark:text-slate-200">{sd.teacherName}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 6: SYLLABUS --- */}
        {activeTab === 'syllabus' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-500" /> Course Syllabus
              </h3>
              <p className="text-xs text-slate-500">Academic syllabus breakdown by subject and term for Class {student.class}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabus.map(sy => (
                <div key={sy.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {sy.term}
                    </span>
                    <strong className="text-sm font-bold text-slate-900 dark:text-white">{sy.subject}</strong>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">{sy.chapters}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 7: TRANSPORT --- */}
        {activeTab === 'transport' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-500" /> School Bus Transport Routes
              </h3>
              <p className="text-xs text-slate-500">Official bus stops, vehicle numbers, driver phone contacts, and monthly transport fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transportRoutes.map(tr => (
                <div key={tr.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{tr.routeName}</h4>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      ₹{tr.feeMonthly}/mo
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div>Bus Number: <strong>{tr.busNumber}</strong></div>
                    <div>Driver Name: <strong>{tr.driverName}</strong> ({tr.driverPhone})</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <strong className="block text-slate-700 dark:text-slate-300 mb-1">Stops:</strong>
                    <div className="flex flex-wrap gap-1">
                      {tr.stops.map((st, idx) => (
                        <span key={idx} className="bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                          📍 {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 8: ADMIT CARD --- */}
        {activeTab === 'admit-card' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" /> Official Examination Admit Card
              </h3>
              <p className="text-xs text-slate-500">Print or download hall ticket for upcoming board and term examinations.</p>
            </div>

            {admitCards.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No active admit cards issued yet for your student record.
              </div>
            ) : (
              admitCards.map(ac => (
                <div key={ac.id} id={`admit-card-${ac.id}`} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-rose-500/40 shadow-xl space-y-6">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">{ac.examName}</h3>
                      <p className="text-xs text-slate-500">Model Public School (MPS Sikta) - Hall Ticket</p>
                    </div>
                    <button
                      onClick={() => downloadElementAsPDF(`admit-card-${ac.id}`, `Admit_Card_${student.name.replace(/\s+/g, '_')}.pdf`)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
                    >
                      <Download className="w-4 h-4" /> Download Hall Ticket (PDF)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Student Name:</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{student.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Class & Section:</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{student.class}-{student.section}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Roll Number:</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{ac.rollNo || student.rollNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Issue Date:</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{ac.issueDate}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <strong>Examination Center:</strong>
                    <p>{ac.centerName}</p>
                  </div>

                  {ac.instructions && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 whitespace-pre-line">
                      <strong>Exam Hall Instructions:</strong>
                      <p className="mt-1">{ac.instructions}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 9: DECLARATIONS --- */}
        {activeTab === 'declarations' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-500" /> School Declarations & Code of Conduct
              </h3>
              <p className="text-xs text-slate-500 font-body">Official guidelines, safety rules, and school policies.</p>
            </div>

            <div className="space-y-4">
              {declarations.map(dec => (
                <div key={dec.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{dec.title}</h4>
                    <span className="text-xs text-slate-400">{dec.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">{dec.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 10: WRITE TO SCHOOL MESSAGES --- */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-500" /> Direct Communication Desk
              </h3>
              <p className="text-xs text-slate-500">Send inquiries or messages directly to Model Public School management.</p>
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Send New Inquiry / Note</h4>
              {messageSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {messageSuccess}
                </div>
              )}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Subject / Topic</label>
                  <input
                    type="text"
                    required
                    value={newMessage.subject}
                    onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder="e.g. Inquiry regarding bus timing or fee receipt"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Your Message</label>
                  <textarea
                    required
                    rows={3}
                    value={newMessage.message}
                    onChange={e => setNewMessage({ ...newMessage, message: e.target.value })}
                    placeholder="Write your note or question here..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </div>
            </form>

            {/* Message History */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Previous Messages & Official Replies</h4>
              {schoolMessages.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">No messages sent yet.</div>
              ) : (
                schoolMessages.map(msg => (
                  <div key={msg.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-900 dark:text-white">{msg.subject}</strong>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        msg.status === 'Replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{msg.message}</p>
                    {msg.reply && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        <strong className="text-sky-600 dark:text-sky-400 block mb-0.5">School Reply:</strong>
                        <p>{msg.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB 11: PROFILE RECORD CORRECTION REQUESTS --- */}
        {activeTab === 'record-updates' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" /> Profile & Record Correction Request Desk
              </h3>
              <p className="text-xs text-slate-500">Request updates or corrections for student name, parent name, date of birth, or contact phone.</p>
            </div>

            <form onSubmit={handleSendUpdateReq} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Submit Record Update Request</h4>
              {updateReqSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {updateReqSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Field to Update</label>
                  <select
                    value={newUpdateReq.field}
                    onChange={e => setNewUpdateReq({ ...newUpdateReq, field: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Student Name">Student Name</option>
                    <option value="Parent Name">Parent / Guardian Name</option>
                    <option value="Phone / Contact Number">Phone / Contact Number</option>
                    <option value="Date of Birth">Date of Birth</option>
                    <option value="Address">Address</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Current Recorded Value</label>
                  <input
                    type="text"
                    value={newUpdateReq.oldValue}
                    onChange={e => setNewUpdateReq({ ...newUpdateReq, oldValue: e.target.value })}
                    placeholder="e.g. Existing typo"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Corrected New Value</label>
                  <input
                    type="text"
                    required
                    value={newUpdateReq.newValue}
                    onChange={e => setNewUpdateReq({ ...newUpdateReq, newValue: e.target.value })}
                    placeholder="e.g. Correct spelling"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Submit Request To Admin
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Request History</h4>
              {recordUpdates.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">No record correction requests submitted yet.</div>
              ) : (
                recordUpdates.map(req => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">{req.field} Update</strong>
                      <span className="text-slate-500">New Value: {req.newValue} (Old: {req.oldValue || 'N/A'})</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- EXISTING TABS (ID Card, Attendance, Trends, Report Cards, Homework, AI Tutor, Fees) --- */}
        {activeTab === 'idcard' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-4">
              Digital Student Identity Card
            </h3>
            <StudentIDCard student={student} />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Header with Month Selector and Status Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                    Attendance Record & Working Days
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Active academic tracking for {student.name} (Class {student.class}-{student.section}, Roll: {student.rollNo})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Academic Period:</span>
                  <select
                    value={attendanceMonth}
                    onChange={e => setAttendanceMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="2026-08" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">August 2026</option>
                    <option value="2026-07" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">July 2026</option>
                    <option value="2026-06" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">June 2026</option>
                    <option value="2026-05" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">May 2026</option>
                    <option value="2026-04" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">April 2026</option>
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Full Session (Apr-Aug 2026)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Analytics Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1.5 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Marked Attendance Rate</span>
                <div className="text-3xl font-black text-emerald-500 font-heading">{attendancePercentage}%</div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {totalAttended} attended of {markedWorkingDays} marked days
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total School Working Days</span>
                <div className="text-3xl font-black text-blue-500 font-heading">{totalSchoolWorkingDays} <span className="text-sm font-bold">Days</span></div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {markedWorkingDays} Marked by Teacher, {notMentionedDays} Pending
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1.5 ring-1 ring-purple-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">Sundays & Holidays</span>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-heading flex items-center justify-center gap-1">
                  🌴 {holidayDays} <span className="text-sm font-bold">Days</span>
                </div>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">Excluded from total working days</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CBSE Minimum (75%)</span>
                <div className={`text-xl font-black font-heading ${attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {attendancePercentage >= 75 ? 'ELIGIBLE (75%+)' : 'ATTENDANCE ALERT'}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {attendancePercentage >= 75 ? 'Meets CBSE criteria' : 'Requires improvement'}
                </p>
              </div>
            </div>

            {/* Attendance Status Filter Pills */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" /> Daily Calendar Log ({attendanceMonthLabels[attendanceMonth] || attendanceMonth})
                  </h3>
                  <p className="text-xs text-slate-500">Every day is accounted for: Present, Absent, Late, Leave, Holiday, or Not Mentioned</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setAttendanceStatusFilter('all')}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${attendanceStatusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                  >
                    All ({processedAttendanceTimeline.length})
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('Present')}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${attendanceStatusFilter === 'Present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'}`}
                  >
                    Present ({presentDays + lateDays})
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('Absent')}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${attendanceStatusFilter === 'Absent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'}`}
                  >
                    Absent ({absentDays})
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('Not Mentioned')}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${attendanceStatusFilter === 'Not Mentioned' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'}`}
                  >
                    Not Mentioned ({notMentionedDays})
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('Holiday')}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${attendanceStatusFilter === 'Holiday' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'}`}
                  >
                    Holidays ({holidayDays})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Date & Day</th>
                      <th className="p-3">Class & Section</th>
                      <th className="p-3">Attendance Status</th>
                      <th className="p-3 rounded-r-xl">Teacher Remarks & Status Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {displayedAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No attendance records matching this filter in selected period.
                        </td>
                      </tr>
                    ) : (
                      displayedAttendanceList.map(a => {
                        const dateObj = new Date(`${a.date}T00:00:00`);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              <span className="font-mono">{a.date}</span>
                              <span className="ml-2 text-[10px] uppercase font-bold text-slate-400">({dayName})</span>
                            </td>
                            <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">
                              Class {a.class}-{a.section}
                            </td>
                            <td className="p-3 font-bold">
                              {a.status === 'Present' && (
                                <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-black border border-emerald-300/40 inline-flex items-center gap-1">
                                  ✓ Present
                                </span>
                              )}
                              {a.status === 'Absent' && (
                                <span className="text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-lg font-black border border-rose-300/40 inline-flex items-center gap-1">
                                  ✕ Absent
                                </span>
                              )}
                              {a.status === 'Late' && (
                                <span className="text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-lg font-black border border-amber-300/40 inline-flex items-center gap-1">
                                  ⏱ Late
                                </span>
                              )}
                              {a.status === 'Leave' && (
                                <span className="text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-lg font-black border border-blue-300/40 inline-flex items-center gap-1">
                                  📄 Approved Leave
                                </span>
                              )}
                              {a.status === 'Holiday' && (
                                <span className="text-purple-700 bg-purple-100 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-1 rounded-lg font-black border border-purple-300/40 inline-flex items-center gap-1">
                                  🌴 Sunday / School Holiday
                                </span>
                              )}
                              {a.status === 'Not Mentioned' && (
                                <span className="text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-lg font-black border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
                                  ⚠️ Not Mentioned
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                              {a.status === 'Not Mentioned' ? (
                                <span className="text-amber-600 dark:text-amber-400 italic">
                                  {a.remarks || 'Attendance not input by class teacher for this date'}
                                </span>
                              ) : (
                                a.remarks || (a.status === 'Holiday' ? 'Official Weekly Sunday Holiday' : 'Marked by Class Teacher')
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <AcademicProgressAnalytics examResults={examResults} studentName={student.name} />
        )}

        {activeTab === 'reportcard' && (
          <div className="space-y-6">
            {examResults.map(exam => (
              <div
                key={exam.id}
                id={`report-card-${exam.id}`}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/60 shadow-xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                      Official Academic Marksheet
                    </span>
                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                      {exam.examType} ({exam.academicYear})
                    </h3>
                    <p className="text-xs text-slate-500">Model Public School (MPS Sikta) - Affiliation No: 330854</p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-500 font-heading">{exam.percentage}%</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade: {exam.grade}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white uppercase font-bold">
                      <tr>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3">Max Marks</th>
                        <th className="p-3">Marks Obtained</th>
                        <th className="p-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {exam.subjects.map((sub, idx) => (
                        <tr key={idx} className="font-medium">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{sub.subject}</td>
                          <td className="p-3">{sub.maxMarks}</td>
                          <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{sub.marksObtained}</td>
                          <td className="p-3 font-bold text-emerald-600">{sub.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-amber-50 dark:bg-amber-950/40 font-bold border-t border-amber-300">
                      <tr>
                        <td className="p-3">Grand Total</td>
                        <td className="p-3">{exam.maxTotalMarks}</td>
                        <td className="p-3 text-amber-600">{exam.totalMarks}</td>
                        <td className="p-3 text-emerald-600">{exam.grade}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block font-bold">Class Teacher Remarks:</strong>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{exam.teacherRemarks || 'Consistent performance.'}"</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => downloadElementAsPDF(`report-card-${exam.id}`, `Report_Card_${exam.examType.replace(/\s+/g, '_')}.pdf`)}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow"
                  >
                    <Download className="w-4 h-4" /> Download Report Card PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'homework' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
              Live Class Assignments & Homework
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeworkList.map(hw => (
                <div
                  key={hw.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                      {hw.subject}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      hw.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Priority: {hw.priority}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">{hw.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">{hw.description}</p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Teacher: {hw.teacherName}</span>
                    <span className="font-bold text-amber-600">Due Date: {hw.dueDate}</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('ai-tutor')}
                    className="w-full py-2 bg-blue-50 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-blue-900 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-slate-700 mt-2"
                  >
                    <Bot className="w-4 h-4 text-amber-500" /> Get Step-by-Step AI Help with this Homework
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai-tutor' && (
          <div className="space-y-4">
            <AIHomeworkTutor />
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full">
                  Official School Financial Record
                </span>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1">
                  Fee Payment Statement & Official Receipt
                </h3>
                <p className="text-xs text-slate-500">
                  Session 2026-2027 • Model Public School (MPS Sikta)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => downloadElementAsPDF('student-fee-receipt', `Official_Fee_Receipt_${student.name.replace(/\s+/g, '_')}_${student.rollNo}.pdf`)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-2xl font-medium text-xs shadow-md transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" /> Download PDF Receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-2xl font-medium text-xs border border-slate-700 shadow-md transition-all hover:scale-[1.02]"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Print Receipt
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Session Fee</span>
                  <span className="text-xl font-bold font-heading">₹{student.feeInfo.totalAnnual || (student.feeInfo.paid + student.feeInfo.pending)}</span>
                </div>
                <IndianRupee className="w-6 h-6 text-slate-400" />
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex justify-between items-center">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase font-bold">Total Fees Paid</span>
                  <span className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400">₹{student.feeInfo.paid}</span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex justify-between items-center">
                <div>
                  <span className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
                  <span className="text-xl font-bold font-heading text-amber-600 dark:text-amber-400">₹{student.feeInfo.pending}</span>
                </div>
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>

            {/* Itemized Fee Ledger */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
                  Monthly Installment Status & Paid Receipt Records
                </h4>
                <span className="text-[11px] text-slate-500">
                  Only paid fee installments issue official receipts
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Installment Month</th>
                      <th className="p-3">Amount (₹)</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Payment / Due Date</th>
                      <th className="p-3 text-right">Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {student.feeInfo.months?.map((m, idx) => {
                      const isPaid = m.status === 'Paid';
                      const isSelected = isPaid && selectedFeeMonth === m.month;

                      return (
                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-amber-500/10 dark:bg-amber-500/20' : ''}`}>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{m.month}</td>
                          <td className="p-3 font-medium">₹{m.amount}</td>
                          <td className="p-3 font-bold">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md text-[11px] border border-emerald-200 dark:border-emerald-800 font-extrabold">
                                <Check className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1 rounded-md text-[11px] border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500">{m.paidDate || m.dueDate || '-'}</td>
                          <td className="p-3 text-right">
                            {isPaid ? (
                              <button
                                onClick={() => setSelectedFeeMonth(m.month)}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" /> {isSelected ? 'Active Receipt' : 'View Paid Receipt'}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-md text-[11px] font-extrabold border-2 border-rose-500/60 dark:border-rose-700 uppercase tracking-wider shadow-2xs">
                                <AlertCircle className="w-3 h-3" /> UNPAID
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Fee Receipt Card (ONLY FOR PAID MONTHS) */}
            {student.feeInfo.months?.some(m => m.status === 'Paid') ? (
              <div id="student-fee-receipt" className="bg-stone-100 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <OfficialFeeReceipt
                  student={student}
                  settings={settings}
                  selectedMonth={
                    (student.feeInfo.months?.find(m => m.month === selectedFeeMonth && m.status === 'Paid')
                      || student.feeInfo.months?.find(m => m.status === 'Paid'))?.month || 'Paid Installment'
                  }
                />
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Paid Fee Receipts Issued Yet</h5>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Official fee receipts are generated automatically once fee installments are marked as Paid by the school administration counter.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
