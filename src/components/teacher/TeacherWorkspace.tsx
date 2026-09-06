import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../lib/api';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { downloadElementAsPDF } from '../../lib/pdf';
import {
  Teacher, Student, AttendanceRecord, ExamResult, Homework, OnlineClass, OnlineExam,
  TimeTableSlot, StudyMaterial, SchoolDiaryEntry, SyllabusItem, TransportRoute, AdmitCard,
  StudentDeclaration, SchoolMessage, RecordUpdateReq, ParentComplaint
} from '../../types';
import { StudentIDCard } from '../common/StudentIDCard';
import { OfficialFeeReceipt } from '../common/OfficialFeeReceipt';
import { generateDefault12MonthFeeList } from '../../lib/feeUtils';
import { CaptchaWidget } from '../common/CaptchaWidget';
import {
  UserCheck, LogOut, Users, Calendar, Award, BookOpen, Plus, Trash2, Edit3, Save, Upload, Check,
  AlertTriangle, Key, Search, FileText, BarChart2, TrendingUp, CheckCircle2, XCircle, Clock,
  AlertCircle, RefreshCw, DollarSign, PieChart, CreditCard, Video, FileQuestion, ExternalLink,
  Link2, Home, Notebook, BookMarked, Bus, FileCheck, MessageSquare, ShieldCheck, Bot, Sparkles,
  Send, IndianRupee, CheckCircle, Truck, Building2, Printer, Download, Filter, Camera,
  Bell, BellRing, Zap, X, ChevronRight, MessageSquareWarning, PhoneCall, CheckCheck, Reply, UserPlus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

export const TeacherWorkspace: React.FC = () => {
  const { teacher, loginUser, logout } = useAuth();
  const { settings } = useCMS();

  // Teacher & Staff Login State
  const [loginRoleTab, setLoginRoleTab] = useState<'teacher' | 'staff'>('teacher');
  const [loginForm, setLoginForm] = useState({ username: '', phone: '', password: '' });
  const [rememberMeDevice, setRememberMeDevice] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Active Class & Section filter
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');

  // Teacher Data Lists
  const [students, setStudents] = useState<Student[]>([]);

  // 20 Tool Types
  type TabType =
    | 'homework'
    | 'attendance'
    | 'students'
    | 'corrections'
    | 'complaints'
    | 'diary'
    | 'study-material'
    | 'online-classes'
    | 'online-exams'
    | 'timetable'
    | 'messages'
    | 'syllabus'
    | 'marks'
    | 'idcard'
    | 'trends'
    | 'transport'
    | 'admit-card'
    | 'fee'
    | 'declarations';

  // Default selected tool is HOMEWORK as requested!
  const [activeTab, setActiveTab] = useState<TabType>('homework');
  const activeContentRef = useRef<HTMLDivElement>(null);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    setTimeout(() => {
      if (activeContentRef.current) {
        activeContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Data states for all tools
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [onlineClassesList, setOnlineClassesList] = useState<OnlineClass[]>([]);
  const [onlineExamsList, setOnlineExamsList] = useState<OnlineExam[]>([]);
  const [timeTableList, setTimeTableList] = useState<TimeTableSlot[]>([]);
  const [studyMaterialsList, setStudyMaterialsList] = useState<StudyMaterial[]>([]);
  const [schoolDiaryList, setSchoolDiaryList] = useState<SchoolDiaryEntry[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [messagesList, setMessagesList] = useState<SchoolMessage[]>([]);
  const [declarationsList, setDeclarationsList] = useState<StudentDeclaration[]>([]);
  const [recordUpdatesList, setRecordUpdatesList] = useState<RecordUpdateReq[]>([]);
  const [complaintsList, setComplaintsList] = useState<ParentComplaint[]>([]);

  // Complaints & Grievance State
  const [complaintFilter, setComplaintFilter] = useState<'All' | 'Open' | 'Under Review' | 'Resolved'>('All');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState<string>('All');
  const [selectedComplaintForReply, setSelectedComplaintForReply] = useState<ParentComplaint | null>(null);
  const [complaintReplyText, setComplaintReplyText] = useState('');
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [newComplaintForm, setNewComplaintForm] = useState({
    parentName: '',
    studentName: '',
    studentRollNo: '',
    phone: '',
    email: '',
    category: 'Teaching & Academics',
    priority: 'Medium' as 'High' | 'Medium' | 'Low' | 'Urgent',
    subject: '',
    description: ''
  });

  // Corrections State
  const [correctionFilter, setCorrectionFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [showNewCorrectionModal, setShowNewCorrectionModal] = useState(false);
  const [newCorrectionForm, setNewCorrectionForm] = useState({
    studentId: '',
    studentName: '',
    rollNo: '',
    field: 'Parent Phone Number',
    oldValue: '',
    newValue: '',
    reason: ''
  });

  // Selected student for ID Card or Fee Receipt
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

  // Online Classes & Online Exams Forms
  const [newClassForm, setNewClassForm] = useState({
    subject: 'Mathematics',
    title: '',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    zoomUrl: 'https://zoom.us/j/84920193821',
    passcode: 'MPS2026',
    meetingId: '849 2019 3821',
    status: 'Scheduled' as 'Scheduled' | 'Live' | 'Completed'
  });

  const [newExamForm, setNewExamForm] = useState({
    subject: 'Mathematics',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    durationMinutes: 120,
    totalMarks: 100,
    zoomUrl: 'https://zoom.us/j/98123049182',
    instructions: '1. Do not leave camera field.\n2. Keep microphone unmuted upon request.',
    status: 'Scheduled' as 'Scheduled' | 'Live' | 'Completed'
  });

  // Homework Form
  const [newHw, setNewHw] = useState({
    subject: 'Mathematics',
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  // Diary Form
  const [newDiaryNote, setNewDiaryNote] = useState({
    subject: 'Mathematics',
    title: '',
    content: '',
    isImportant: false
  });

  // Study Material Form
  const [newMaterial, setNewMaterial] = useState({
    subject: 'Mathematics',
    title: '',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    description: 'Class lecture slides and chapter notes.'
  });

  // Timetable Slot Form
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    periodNo: 1,
    subject: 'Mathematics',
    startTime: '09:00 AM',
    endTime: '09:45 AM'
  });

  // Message Broadcast Form
  const [newMessageText, setNewMessageText] = useState({
    title: '',
    content: '',
    sender: 'Class Teacher'
  });

  // Syllabus Form
  const [newSyllabusItem, setNewSyllabusItem] = useState({
    subject: 'Mathematics',
    chapterName: 'Chapter 1: Real Numbers',
    status: 'In Progress' as 'Pending' | 'In Progress' | 'Completed'
  });

  // Edit Modal States for Teacher Tools
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [editingOnlineClass, setEditingOnlineClass] = useState<OnlineClass | null>(null);
  const [editingOnlineExam, setEditingOnlineExam] = useState<OnlineExam | null>(null);
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<SchoolDiaryEntry | null>(null);
  const [editingStudyMaterial, setEditingStudyMaterial] = useState<StudyMaterial | null>(null);
  const [editingTimeTableSlot, setEditingTimeTableSlot] = useState<TimeTableSlot | null>(null);
  const [editingSyllabusItem, setEditingSyllabusItem] = useState<SyllabusItem | null>(null);
  const [editingMessage, setEditingMessage] = useState<SchoolMessage | null>(null);
  const [transportList, setTransportList] = useState<TransportRoute[]>([]);
  const [editingTransport, setEditingTransport] = useState<TransportRoute | null>(null);
  const [newTransportForm, setNewTransportForm] = useState({
    routeName: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    fareMonthly: 1000
  });

  // Selected Student for Profile Editing & Password Reset
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [passResetStudent, setPassResetStudent] = useState<Student | null>(null);
  const [passResetVal, setPassResetVal] = useState('');
  const [passResetMsg, setPassResetMsg] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Attendance Date & State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'>>({});
  const [attendanceChartView, setAttendanceChartView] = useState<'trend' | 'breakdown'>('trend');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'monthly'>('daily');
  const [summaryMonth, setSummaryMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [allClassAttendance, setAllClassAttendance] = useState<AttendanceRecord[]>([]);

  // Attendance Success Modal Popup state
  const [attendancePublishModal, setAttendancePublishModal] = useState<{
    isOpen: boolean;
    date: string;
    className: string;
    section: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    leaveCount: number;
    holidayCount: number;
    attendanceRate: number;
    teacherName: string;
    publishedAt: string;
  } | null>(null);

  // Today's attendance alert & notifications
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [dismissedTodayAlert, setDismissedTodayAlert] = useState(false);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Today's Date computations
  const todayDateStr = new Date().toISOString().split('T')[0];
  const isTodaySunday = new Date(todayDateStr + 'T00:00:00').getDay() === 0;
  const todayAttendanceRecords = allClassAttendance.filter(
    a => a.date === todayDateStr && a.class === selectedClass && a.section === selectedSection
  );
  const isTodayPublished = todayAttendanceRecords.length > 0 && todayAttendanceRecords.some(a => a.isPublished !== false);
  const isTodayDraft = todayAttendanceRecords.length > 0 && !isTodayPublished;
  const isTodayMissed = !isTodaySunday && !isTodayPublished && !isTodayDraft;
  const unreadAlertCount = isTodayMissed ? 1 : isTodayDraft ? 1 : 0;

  // Default Subjects List
  const DEFAULT_SUBJECTS = [
    { subject: 'Mathematics', maxMarks: 100, marksObtained: 85, grade: 'A2' },
    { subject: 'Science', maxMarks: 100, marksObtained: 88, grade: 'A2' },
    { subject: 'SST', maxMarks: 100, marksObtained: 82, grade: 'B1' },
    { subject: 'Computer', maxMarks: 100, marksObtained: 94, grade: 'A1' },
    { subject: 'Hindi', maxMarks: 100, marksObtained: 80, grade: 'B1' },
    { subject: 'English', maxMarks: 100, marksObtained: 90, grade: 'A1' },
    { subject: 'Sanskrit/Urdu', maxMarks: 100, marksObtained: 86, grade: 'A2' }
  ];

  // Marks Form States & Full Marks Selection
  const [selectedExamStudent, setSelectedExamStudent] = useState<Student | null>(null);
  const [examType, setExamType] = useState('Mid-Term Examination');
  const [customExamType, setCustomExamType] = useState('');
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS);
  const [teacherRemarks, setTeacherRemarks] = useState('Good academic progress.');
  const [defaultFullMarks, setDefaultFullMarks] = useState<number>(100);
  const [customFullMarksInput, setCustomFullMarksInput] = useState<string>('100');
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [examResultsList, setExamResultsList] = useState<ExamResult[]>([]);
  const [marksheetSearch, setMarksheetSearch] = useState('');

  // Grade calculation helper based on CBSE standard percentage
  const calculateGrade = (obtained: number, max: number): string => {
    if (!max || max <= 0) return 'N/A';
    const pct = (obtained / max) * 100;
    if (pct >= 91) return 'A1';
    if (pct >= 81) return 'A2';
    if (pct >= 71) return 'B1';
    if (pct >= 61) return 'B2';
    if (pct >= 51) return 'C1';
    if (pct >= 41) return 'C2';
    if (pct >= 33) return 'D';
    return 'E (Needs Improvement)';
  };

  // Handler to apply a batch full marks to all subjects
  const handleApplyFullMarksToAll = (marks: number) => {
    const validMarks = Math.max(1, Number(marks) || 100);
    setDefaultFullMarks(validMarks);
    setCustomFullMarksInput(String(validMarks));
    setSubjectsList(prev =>
      prev.map(sub => {
        const newMax = validMarks;
        const newObt = Math.min(Number(sub.marksObtained) || 0, newMax);
        return {
          ...sub,
          maxMarks: newMax,
          marksObtained: newObt,
          grade: calculateGrade(newObt, newMax)
        };
      })
    );
  };

  // Global Realtime Refresh hook for Teacher workspace
  const teacherTopics = [
    'public:teachers',
    'public:students',
    'public:homework',
    'public:attendance',
    'public:exam_results',
    'public:online_classes',
    'public:notice_board'
  ] as const;

  const { refreshCount } = useSupabaseRealtimeRefresh(
    teacherTopics,
    useCallback((event) => {
      if (teacher) {
        console.log(`[TeacherWorkspace] Realtime broadcast on ${event.topic} received -> refreshing class tables`);
        loadClassData(selectedClass || teacher.assignedClass || '10', selectedSection || teacher.assignedSection || 'A');
      }
    }, [teacher, selectedClass, selectedSection, attendanceDate]),
    Boolean(teacher)
  );

  useEffect(() => {
    if (teacher) {
      setSelectedClass(teacher.assignedClass || '10');
      setSelectedSection(teacher.assignedSection || 'A');
      loadClassData(teacher.assignedClass || '10', teacher.assignedSection || 'A');
    }
  }, [teacher, refreshCount]);

  const loadClassData = async (cls: string, sec: string) => {
    try {
      const [stList, hwList, attList, allAtt, ocList, oeList, ttList, smList, sdList, sylList, msgList, trList, reqList, cmpList] = await Promise.all([
        api.getStudents(cls, sec).catch(() => []),
        api.getHomework(cls, sec).catch(() => []),
        api.getAttendance(undefined, cls, sec, attendanceDate, true).catch(() => []),
        api.getAttendance(undefined, cls, sec, undefined, true).catch(() => []),
        api.getOnlineClasses(cls, sec).catch(() => []),
        api.getOnlineExams(cls, sec).catch(() => []),
        api.getTimeTable(cls, sec).catch(() => []),
        api.getStudyMaterial(cls).catch(() => []),
        api.getSchoolDiary(cls, sec).catch(() => []),
        api.getSyllabus(cls).catch(() => []),
        api.getSchoolMessages().catch(() => []),
        api.getTransport().catch(() => []),
        api.getRecordUpdates().catch(() => []),
        api.getComplaints(cls, sec).catch(() => [])
      ]);

      const validStudents = Array.isArray(stList) ? stList : [];
      setStudents(validStudents);
      setHomeworkList(Array.isArray(hwList) ? hwList : []);
      setOnlineClassesList(Array.isArray(ocList) ? ocList : []);
      setOnlineExamsList(Array.isArray(oeList) ? oeList : []);
      setTimeTableList(Array.isArray(ttList) ? ttList : []);
      setStudyMaterialsList(Array.isArray(smList) ? smList : []);
      setSchoolDiaryList(Array.isArray(sdList) ? sdList : []);
      setSyllabusList(Array.isArray(sylList) ? sylList : []);
      setMessagesList(Array.isArray(msgList) ? msgList : []);
      setAllClassAttendance(Array.isArray(allAtt) ? allAtt : []);
      setTransportList(Array.isArray(trList) ? trList : []);
      setRecordUpdatesList(Array.isArray(reqList) ? reqList : []);
      setComplaintsList(Array.isArray(cmpList) ? cmpList : []);

      if (validStudents.length > 0 && !selectedStudentForCard) {
        setSelectedStudentForCard(validStudents[0]);
        setSelectedStudentForReceipt(validStudents[0]);
      }

      const isSundayDate = new Date(attendanceDate + 'T00:00:00').getDay() === 0;
      const map: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
      const validAttendance = Array.isArray(attList) ? attList : [];
      validStudents.forEach(s => {
        const found = validAttendance.find(a => a?.studentId === s.id);
        map[s.id] = isSundayDate ? 'Holiday' : (found ? found.status : 'Present');
      });
      setAttendanceMap(map);
    } catch (e) {
      console.warn('Class data loading notice:', e);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUser = loginForm.username.trim();
    const cleanPass = loginForm.password.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Both Username and Password are required.');
      return;
    }

    setLoginLoading(true);
    try {
      if (loginRoleTab === 'staff') {
        const res = await api.login({
          role: 'staff',
          username: cleanUser,
          password: cleanPass,
          captchaToken: captchaToken || undefined
        });
        if (res.success && res.staff) {
          loginUser({
            user: res.user,
            staff: res.staff,
            rememberMe: rememberMeDevice
          });
          window.location.href = '/staff';
          return;
        } else {
          setLoginError(res.message || 'Invalid driver or staff username / password.');
        }
      } else {
        const res = await api.login({
          role: 'teacher',
          username: cleanUser,
          password: cleanPass,
          captchaToken: captchaToken || undefined
        });
        if (res.success && res.teacher) {
          loginUser({
            user: res.user,
            teacher: res.teacher,
            rememberMe: rememberMeDevice
          });
        } else {
          // Check if it's a staff driver account entered under teacher portal
          try {
            const staffRes = await api.login({
              role: 'staff',
              username: cleanUser,
              password: cleanPass
            });
            if (staffRes.success && staffRes.staff) {
              loginUser({
                user: staffRes.user,
                staff: staffRes.staff,
                rememberMe: rememberMeDevice
              });
              window.location.href = '/staff';
              return;
            }
          } catch (_) {}
          setLoginError(res.message || 'Invalid teacher username or password.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate. Please verify your credentials and connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      if (editingStudent.id && !editingStudent.id.startsWith('temp-')) {
        await api.updateStudent(editingStudent.id, {
          ...editingStudent,
          class: editingStudent.class || selectedClass,
          section: editingStudent.section || selectedSection
        });
      } else {
        await api.createStudent({
          ...editingStudent,
          class: editingStudent.class || selectedClass,
          section: editingStudent.section || selectedSection,
          id: 's-' + Date.now(),
          userId: editingStudent.userId || 'u-st-' + Date.now(),
          admissionDate: editingStudent.admissionDate || new Date().toISOString().split('T')[0]
        });
      }
      setShowStudentModal(false);
      setEditingStudent(null);
      await loadClassData(selectedClass, selectedSection);
      alert(`✓ Student profile for "${editingStudent.name}" saved successfully to database!`);
    } catch (e: any) {
      console.error('Failed to save student profile:', e);
      alert('Failed to save student profile: ' + (e.message || 'Please check all required fields and try again.'));
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student profile for "${name}"? This action cannot be undone.`)) {
      try {
        await api.deleteStudent(id);
        await loadClassData(selectedClass, selectedSection);
        alert(`✓ Student profile for "${name}" deleted.`);
      } catch (e) {
        console.error('Failed to delete student:', e);
        alert('Failed to delete student profile.');
      }
    }
  };

  // --- CORRECTION REQUESTS HANDLERS ---
  const handleApproveCorrection = async (req: RecordUpdateReq) => {
    try {
      await api.approveRecordUpdate(req.id, req.studentId, req.field, req.newValue, teacher?.name || 'Class Teacher');
      setRecordUpdatesList(prev =>
        prev.map(r => (r.id === req.id ? { ...r, status: 'Approved', reviewedBy: teacher?.name, reviewedAt: new Date().toISOString() } : r))
      );
      await loadClassData(selectedClass, selectedSection);
      alert(`✓ Correction request for ${req.studentName} approved and updated in student database!`);
    } catch (e) {
      console.error('Failed to approve correction:', e);
      alert('Failed to approve correction request.');
    }
  };

  const handleRejectCorrection = async (req: RecordUpdateReq) => {
    const reason = window.prompt(`Enter reason for rejecting correction for ${req.studentName}:`, 'Details do not match school records.');
    if (reason === null) return;
    try {
      await api.rejectRecordUpdate(req.id, reason, teacher?.name || 'Class Teacher');
      setRecordUpdatesList(prev =>
        prev.map(r => (r.id === req.id ? { ...r, status: 'Rejected', actionNote: reason, reviewedBy: teacher?.name, reviewedAt: new Date().toISOString() } : r))
      );
      alert(`Correction request for ${req.studentName} has been rejected.`);
    } catch (e) {
      console.error('Failed to reject correction:', e);
      alert('Failed to reject correction request.');
    }
  };

  const handleCreateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorrectionForm.studentName) {
      alert('Please enter student name');
      return;
    }
    try {
      const created = await api.createRecordUpdate({
        studentId: newCorrectionForm.studentId || 's-gen-' + Date.now(),
        studentName: newCorrectionForm.studentName,
        class: selectedClass,
        section: selectedSection,
        rollNo: newCorrectionForm.rollNo,
        field: newCorrectionForm.field,
        oldValue: newCorrectionForm.oldValue,
        newValue: newCorrectionForm.newValue,
        reason: newCorrectionForm.reason
      });
      setRecordUpdatesList(prev => [created, ...prev]);
      setShowNewCorrectionModal(false);
      setNewCorrectionForm({
        studentId: '',
        studentName: '',
        rollNo: '',
        field: 'Parent Phone Number',
        oldValue: '',
        newValue: '',
        reason: ''
      });
      alert('✓ Correction request logged successfully!');
    } catch (e) {
      console.error('Failed to create correction:', e);
      alert('Failed to log correction request.');
    }
  };

  // --- PARENT COMPLAINTS HANDLERS ---
  const handleReplyComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintForReply || !complaintReplyText.trim()) return;
    try {
      const updated = await api.replyToComplaint(
        selectedComplaintForReply.id,
        complaintReplyText.trim(),
        teacher?.name || 'Class Teacher',
        'Resolved'
      );
      setComplaintsList(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setSelectedComplaintForReply(null);
      setComplaintReplyText('');
      alert('✓ Reply sent to parent and complaint marked as Resolved!');
    } catch (e) {
      console.error('Failed to reply to complaint:', e);
      alert('Failed to send reply to parent.');
    }
  };

  const handleUpdateComplaintStatus = async (id: string, status: 'Open' | 'Under Review' | 'Resolved' | 'Closed') => {
    try {
      const updated = await api.updateComplaintStatus(id, status);
      setComplaintsList(prev => prev.map(c => (c.id === id ? updated : c)));
    } catch (e) {
      console.error('Failed to update complaint status:', e);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this complaint record?')) {
      try {
        await api.deleteComplaint(id);
        setComplaintsList(prev => prev.filter(c => c.id !== id));
      } catch (e) {
        console.error('Failed to delete complaint:', e);
      }
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintForm.parentName || !newComplaintForm.subject) {
      alert('Please fill parent name and complaint subject.');
      return;
    }
    try {
      const created = await api.createComplaint({
        parentName: newComplaintForm.parentName,
        studentName: newComplaintForm.studentName,
        studentRollNo: newComplaintForm.studentRollNo,
        class: selectedClass,
        section: selectedSection,
        phone: newComplaintForm.phone,
        email: newComplaintForm.email,
        category: newComplaintForm.category,
        priority: newComplaintForm.priority,
        subject: newComplaintForm.subject,
        description: newComplaintForm.description
      });
      const newCompl = (created as any)?.complaint || (created as any);
      if (newCompl && newCompl.id) {
        setComplaintsList(prev => [newCompl as ParentComplaint, ...prev]);
      }
      setShowNewComplaintModal(false);
      setNewComplaintForm({
        parentName: '',
        studentName: '',
        studentRollNo: '',
        phone: '',
        email: '',
        category: 'Teaching & Academics',
        priority: 'Medium',
        subject: '',
        description: ''
      });
      alert('✓ Grievance / Complaint registered successfully!');
    } catch (e) {
      console.error('Failed to create complaint:', e);
      alert('Failed to register complaint.');
    }
  };

  const isSunday = new Date(attendanceDate + 'T00:00:00').getDay() === 0;

  const handleAttendanceDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    const isSundayDate = new Date(newDate + 'T00:00:00').getDay() === 0;
    const map: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
    const dateRecords = allClassAttendance.filter(
      a => a.date === newDate && a.class === selectedClass && a.section === selectedSection
    );
    students.forEach(s => {
      const found = dateRecords.find(a => a.studentId === s.id);
      map[s.id] = isSundayDate ? 'Holiday' : (found && found.status !== 'Not Mentioned' ? found.status : 'Present');
    });
    setAttendanceMap(map);
  };

  const handleSaveAttendance = async (publish: boolean = false) => {
    if (students.length === 0) {
      alert(`No student records found in Class ${selectedClass}-${selectedSection}.`);
      return;
    }
    try {
      const records = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        class: selectedClass,
        section: selectedSection,
        date: attendanceDate,
        status: isSunday ? ('Holiday' as const) : (attendanceMap[s.id] || 'Present'),
        isPublished: publish,
        teacherName: teacher?.name || 'Class Teacher',
        publishedAt: publish ? new Date().toISOString() : undefined
      }));
      await api.markAttendance(records);
      await loadClassData(selectedClass, selectedSection);

      const pCount = records.filter(r => r.status === 'Present').length;
      const aCount = records.filter(r => r.status === 'Absent').length;
      const lCount = records.filter(r => r.status === 'Late').length;
      const lvCount = records.filter(r => r.status === 'Leave').length;
      const hCount = records.filter(r => r.status === 'Holiday').length;
      const rate = students.length > 0 ? Number((((pCount + lCount) / Math.max(1, students.length - hCount)) * 100).toFixed(1)) : 100;

      if (publish) {
        setAttendancePublishModal({
          isOpen: true,
          date: attendanceDate,
          className: selectedClass,
          section: selectedSection,
          totalStudents: students.length,
          presentCount: pCount,
          absentCount: aCount,
          lateCount: lCount,
          leaveCount: lvCount,
          holidayCount: hCount,
          attendanceRate: rate,
          teacherName: teacher?.name || 'Class Teacher',
          publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        alert(`Attendance draft for ${attendanceDate} saved successfully!`);
      }
    } catch (e) {
      console.error('Failed to save attendance:', e);
      alert('Failed to save attendance records.');
    }
  };

  const handleQuickMarkAllPresentAndPublish = async () => {
    if (students.length === 0) {
      alert(`No student records found in Class ${selectedClass}-${selectedSection}.`);
      return;
    }
    setQuickSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        class: selectedClass,
        section: selectedSection,
        date: todayDateStr,
        status: 'Present' as const,
        isPublished: true,
        teacherName: teacher?.name || 'Class Teacher',
        publishedAt: new Date().toISOString()
      }));
      await api.markAttendance(records);
      setAttendanceDate(todayDateStr);
      const newMap: Record<string, 'Present'> = {};
      students.forEach(s => { newMap[s.id] = 'Present'; });
      setAttendanceMap(newMap);
      await loadClassData(selectedClass, selectedSection);
      
      setAttendancePublishModal({
        isOpen: true,
        date: todayDateStr,
        className: selectedClass,
        section: selectedSection,
        totalStudents: students.length,
        presentCount: students.length,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        holidayCount: 0,
        attendanceRate: 100,
        teacherName: teacher?.name || 'Class Teacher',
        publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e) {
      console.error('Quick publish failed:', e);
      alert('Failed to quickly publish attendance. Please try from the Attendance tab.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleOpenTodayAttendance = () => {
    setAttendanceDate(todayDateStr);
    setAttendanceViewMode('daily');
    handleSwitchTab('attendance');
  };

  const handleQuickSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passResetStudent) return;
    try {
      await api.updateStudent(passResetStudent.id, {
        ...passResetStudent,
        password: passResetVal
      });
      setPassResetMsg(`Password successfully updated for ${passResetStudent.name}!`);
      setTimeout(() => {
        setPassResetStudent(null);
        setPassResetVal('');
        setPassResetMsg('');
        loadClassData(selectedClass, selectedSection);
      }, 1200);
    } catch (e) {
      setPassResetMsg('Failed to update password. Please try again.');
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempHw: Homework = {
      id: 'hw-' + Date.now(),
      class: selectedClass,
      section: selectedSection,
      subject: newHw.subject,
      title: newHw.title,
      description: newHw.description,
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: newHw.dueDate,
      priority: newHw.priority,
      teacherName: teacher?.name || 'Class Teacher'
    };
    setHomeworkList(prev => [tempHw, ...prev]);
    setNewHw({ subject: 'Mathematics', title: '', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'Medium' });
    try {
      await api.createHomework(tempHw);
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    setHomeworkList(prev => prev.filter(h => h.id !== id));
    try {
      await api.deleteHomework(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOnlineClass = async (id: string) => {
    if (window.confirm('Delete this online class entry?')) {
      await api.deleteOnlineClass(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteOnlineExam = async (id: string) => {
    if (window.confirm('Delete this online exam entry?')) {
      await api.deleteOnlineExam(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteDiaryEntry = async (id: string) => {
    if (window.confirm('Delete this school diary entry?')) {
      await api.deleteSchoolDiary(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteStudyMaterial = async (id: string) => {
    if (window.confirm('Delete this study material?')) {
      await api.deleteStudyMaterial(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteTimeTableSlot = async (id: string) => {
    if (window.confirm('Delete this timetable slot?')) {
      await api.deleteTimeTableSlot(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteSyllabusItem = async (id: string) => {
    if (window.confirm('Delete this syllabus item?')) {
      await api.deleteSyllabus(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (window.confirm('Delete this message?')) {
      await api.deleteSchoolMessage(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleCreateTransportRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransportForm.routeName) return;
    await api.createTransport({
      id: 'tr-' + Date.now(),
      routeName: newTransportForm.routeName,
      vehicleNo: newTransportForm.vehicleNo,
      driverName: newTransportForm.driverName,
      driverPhone: newTransportForm.driverPhone,
      fareMonthly: Number(newTransportForm.fareMonthly)
    });
    setNewTransportForm({ routeName: '', vehicleNo: '', driverName: '', driverPhone: '', fareMonthly: 1000 });
    loadClassData(selectedClass, selectedSection);
  };

  const handleDeleteTransportRoute = async (id: string) => {
    if (window.confirm('Delete this bus route?')) {
      await api.deleteTransport(id);
      loadClassData(selectedClass, selectedSection);
    }
  };

  const handleCreateDiaryEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiaryNote.title) return;
    const entry: Partial<SchoolDiaryEntry> = {
      class: selectedClass,
      section: selectedSection,
      date: new Date().toISOString().split('T')[0],
      teacherName: teacher?.name || 'Class Teacher',
      subject: newDiaryNote.subject,
      note: newDiaryNote.content || newDiaryNote.title
    };
    try {
      await api.createSchoolDiary(entry);
      setNewDiaryNote({ subject: 'Mathematics', title: '', content: '', isImportant: false });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStudyMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;
    try {
      await api.createStudyMaterial({
        class: selectedClass,
        section: selectedSection,
        subject: newMaterial.subject,
        title: newMaterial.title,
        fileUrl: newMaterial.fileUrl,
        category: 'Notes',
        uploadedBy: teacher?.name || 'Teacher',
        date: new Date().toISOString().split('T')[0],
        description: newMaterial.description
      });
      setNewMaterial({ subject: 'Mathematics', title: '', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: '' });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOnlineClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.title) return;
    try {
      await api.createOnlineClass({
        class: selectedClass,
        section: selectedSection,
        subject: newClassForm.subject,
        title: newClassForm.title,
        teacherName: teacher?.name || 'Teacher',
        startTime: newClassForm.startTime,
        endTime: newClassForm.endTime,
        zoomUrl: newClassForm.zoomUrl,
        passcode: newClassForm.passcode,
        meetingId: newClassForm.meetingId,
        status: newClassForm.status
      });
      setNewClassForm({
        subject: 'Mathematics',
        title: '',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        zoomUrl: 'https://zoom.us/j/84920193821',
        passcode: 'MPS2026',
        meetingId: '849 2019 3821',
        status: 'Scheduled'
      });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOnlineExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamForm.title) return;
    try {
      await api.createOnlineExam({
        class: selectedClass,
        section: selectedSection,
        subject: newExamForm.subject,
        title: newExamForm.title,
        date: newExamForm.date,
        startTime: newExamForm.startTime,
        endTime: newExamForm.endTime,
        durationMinutes: Number(newExamForm.durationMinutes),
        totalMarks: Number(newExamForm.totalMarks),
        zoomUrl: newExamForm.zoomUrl,
        instructions: newExamForm.instructions,
        status: (newExamForm.status === 'Live' || newExamForm.status === 'Completed') ? newExamForm.status : 'Upcoming'
      });
      setNewExamForm({
        subject: 'Mathematics',
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        durationMinutes: 120,
        totalMarks: 100,
        zoomUrl: 'https://zoom.us/j/98123049182',
        instructions: '1. Do not leave camera field.\n2. Keep microphone unmuted upon request.',
        status: 'Scheduled'
      });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTimeTableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTimeTableSlot({
        class: selectedClass,
        section: selectedSection,
        day: newSlot.day as any,
        time: `${newSlot.startTime || '09:00 AM'} - ${newSlot.endTime || '10:00 AM'}`,
        subject: newSlot.subject,
        teacherName: teacher?.name || 'Class Teacher'
      });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.title || !newMessageText.content) return;
    try {
      await api.createSchoolMessage({
        class: selectedClass,
        section: selectedSection,
        studentId: 'ALL',
        studentName: 'Class Students',
        subject: newMessageText.title || 'Class Announcement',
        message: newMessageText.content,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        sender: teacher?.name || 'Class Teacher',
        senderRole: 'Teacher'
      });
      setNewMessageText({ title: '', content: '', sender: teacher?.name || 'Class Teacher' });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSyllabusItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSyllabus({
        class: selectedClass,
        section: selectedSection,
        subject: newSyllabusItem.subject,
        term: 'Term 1',
        chapters: newSyllabusItem.chapterName
      });
      loadClassData(selectedClass, selectedSection);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamStudent) return;
    const activeExamType = isCustomExam ? (customExamType || 'Custom Exam') : examType;
    const studentName = selectedExamStudent.name;
    try {
      await api.saveExamResult({
        studentId: selectedExamStudent.id,
        examType: activeExamType,
        academicYear: '2025-2026',
        subjects: subjectsList,
        teacherRemarks
      });
      alert(`✓ Marksheet successfully published for ${studentName} (${activeExamType}) with Full Marks standard applied!`);
      setSelectedExamStudent(null);
      // Reload class exam results
      api.getExamResults(undefined, true).then(res => {
        if (Array.isArray(res)) setExamResultsList(res);
      }).catch(() => {});
    } catch (e: any) {
      console.error(e);
      alert('Failed to record exam marks: ' + (e.message || 'Please try again.'));
    }
  };

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 text-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 p-2 text-emerald-400 flex items-center justify-center mx-auto shadow-xl overflow-hidden ring-4 ring-emerald-500/20">
              <img
                src={settings?.logo_url || '/logo.svg'}
                alt="MPS Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/logo.svg')) {
                    target.src = '/logo.svg';
                  }
                }}
              />
            </div>
            <h2 className="text-2xl font-black text-white font-heading">
              Teacher Workspace Portal
            </h2>
            <p className="text-xs text-slate-400">Model Public School (MPS Sikta)</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-4">
            {/* Role Switcher Tab */}
            <div className="grid grid-cols-2 p-1 bg-slate-800 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => { setLoginRoleTab('teacher'); setLoginError(''); }}
                className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginRoleTab === 'teacher'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Teacher Portal</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginRoleTab('staff'); setLoginError(''); }}
                className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginRoleTab === 'staff'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Driver & Staff</span>
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/80 text-rose-300 text-xs rounded-xl border border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {loginRoleTab === 'staff' ? 'Driver / Staff Username' : 'Teacher Username'}
                </label>
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder={loginRoleTab === 'staff' ? 'e.g. driver1, cleaner1' : 'Enter teacher username'}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-normal"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-normal"
                />
              </div>

              {captchaRequired && (
                <CaptchaWidget
                  onVerify={token => setCaptchaToken(token)}
                  isVerified={!!captchaToken}
                />
              )}

              <div className="flex items-center justify-between text-xs py-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={rememberMeDevice}
                    onChange={e => setRememberMeDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-200">Keep me logged in on this computer</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline">Saved session ✓</span>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01] cursor-pointer"
              >
                {loginLoading ? 'Authenticating...' : loginRoleTab === 'staff' ? 'Sign In To Driver & Transport Portal' : 'Sign In To Teacher Workspace'}
              </button>

              <div className="pt-3 border-t border-slate-800 text-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Home className="w-3.5 h-3.5" /> Return to Website Homepage
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 20 Tools Definition array ordered logically: Daily use first!
  const TOOLS_LIST: { id: TabType; title: string; subtitle: string; icon: any; color: string; alert?: boolean }[] = [
    { id: 'homework', title: 'Homework', subtitle: `${homeworkList.length} Tasks`, icon: BookOpen, color: 'text-amber-500' },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: isTodayPublished
        ? '✓ Marked Today'
        : isTodayDraft
        ? '⚠️ Draft Today'
        : isTodaySunday
        ? 'Sunday Holiday'
        : '⚠️ Missing Today',
      icon: Calendar,
      color: isTodayMissed ? 'text-rose-500' : isTodayPublished ? 'text-emerald-500' : 'text-amber-500',
      alert: isTodayMissed || isTodayDraft
    },
    { id: 'students', title: 'Students', subtitle: `${students.length} Profiles`, icon: Users, color: 'text-indigo-600' },
    {
      id: 'corrections',
      title: 'Corrections',
      subtitle: `${recordUpdatesList.filter(r => r.status === 'Pending').length} Pending`,
      icon: ShieldCheck,
      color: 'text-purple-600',
      alert: recordUpdatesList.some(r => r.status === 'Pending')
    },
    {
      id: 'complaints',
      title: 'Complaints',
      subtitle: `${complaintsList.filter(c => c.status === 'Open' || c.status === 'Under Review').length} Open`,
      icon: MessageSquareWarning,
      color: 'text-rose-500',
      alert: complaintsList.some(c => c.status === 'Open' || c.status === 'Under Review')
    },
    { id: 'diary', title: 'School Diary', subtitle: 'Teacher Notes', icon: Notebook, color: 'text-blue-500' },
    { id: 'study-material', title: 'Study Material', subtitle: 'PDFs & Notes', icon: FileText, color: 'text-purple-500' },
    { id: 'online-classes', title: 'Online Classes', subtitle: `${onlineClassesList.length} Live Zoom`, icon: Video, color: 'text-indigo-500' },
    { id: 'online-exams', title: 'Online Exams', subtitle: `${onlineExamsList.length} Scheduled`, icon: FileQuestion, color: 'text-rose-500' },
    { id: 'timetable', title: 'Time Table', subtitle: 'Daily Routine', icon: Clock, color: 'text-teal-500' },
    { id: 'messages', title: 'Messages', subtitle: 'Broadcast Alerts', icon: MessageSquare, color: 'text-sky-500' },
    { id: 'syllabus', title: 'Course Syllabus', subtitle: 'Curriculum', icon: BookMarked, color: 'text-emerald-600' },
    { id: 'marks', title: 'Marksheets', subtitle: 'Report Card', icon: Award, color: 'text-amber-600' },
    { id: 'idcard', title: 'Digital ID Card', subtitle: 'Identity', icon: CreditCard, color: 'text-emerald-500' },
    { id: 'trends', title: 'Progress Trends', subtitle: 'Analytics', icon: TrendingUp, color: 'text-amber-500' },
    { id: 'transport', title: 'School Transport', subtitle: 'Bus Route', icon: Bus, color: 'text-orange-500' },
    { id: 'admit-card', title: 'Admit Card', subtitle: 'Exam Pass', icon: FileCheck, color: 'text-rose-500' },
    { id: 'fee', title: 'Fee Receipts', subtitle: 'Billing History', icon: IndianRupee, color: 'text-teal-600' },
    { id: 'declarations', title: 'Declarations', subtitle: 'Rules & Safety', icon: ShieldCheck, color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-4 sm:py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              {teacher.photo ? (
                <img
                  src={teacher.photo}
                  alt={teacher.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-slate-800"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 font-bold shadow-md">
                  <UserCheck className="w-8 h-8" />
                </div>
              )}
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 flex items-center gap-0.5 shadow">
                Teacher
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold font-heading text-white">{teacher.name}</h1>
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                  Assigned: Class {selectedClass}-{selectedSection}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Subject Specialist: <strong className="text-amber-300">{teacher.subject}</strong> | Username: <span className="text-slate-400">{teacher.username}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-800/90 p-2 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-extrabold text-amber-400 pl-2">Class:</span>
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                loadClassData(e.target.value, selectedSection);
              }}
              className="bg-slate-900 border border-slate-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                <option key={c} value={c}>
                  {['Playgroup', 'Nursery', 'LKG', 'UKG'].includes(c) ? c : `Class ${c}`}
                </option>
              ))}
            </select>

            <span className="text-[11px] font-extrabold text-amber-400">Sec:</span>
            <select
              value={selectedSection}
              onChange={e => {
                setSelectedSection(e.target.value);
                loadClassData(selectedClass, e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {['A', 'B', 'C', 'D'].map(s => (
                <option key={s} value={s}>Sec {s}</option>
              ))}
            </select>

            {/* Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`relative p-2 rounded-xl border transition-all ${
                  unreadAlertCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Teacher Notifications"
              >
                {unreadAlertCount > 0 ? (
                  <BellRing className="w-4 h-4 animate-bounce text-rose-400" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {unreadAlertCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                      <Bell className="w-4 h-4 text-amber-400" /> Notifications & Action Alerts
                    </div>
                    <button
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Attendance Alert Item */}
                  <div className={`p-3 rounded-xl border ${
                    isTodayMissed
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : isTodayDraft
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : isTodaySunday
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {isTodayMissed && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                          {isTodayDraft && <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                          {isTodayPublished && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          {isTodaySunday && <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                          <span>
                            {isTodayMissed
                              ? "Daily Attendance Missing!"
                              : isTodayDraft
                              ? "Draft Attendance Pending"
                              : isTodaySunday
                              ? "Sunday Holiday"
                              : "Attendance Submitted"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-tight">
                          {isTodayMissed
                            ? `Class ${selectedClass}-${selectedSection} attendance for today (${todayDateStr}) has not been submitted.`
                            : isTodayDraft
                            ? `Class ${selectedClass}-${selectedSection} attendance is saved as draft and needs to be published.`
                            : isTodaySunday
                            ? 'Today is Sunday. Standard weekly off applies.'
                            : `Class ${selectedClass}-${selectedSection} attendance recorded & published for today.`}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                        isTodayMissed
                          ? 'bg-rose-600 text-white'
                          : isTodayDraft
                          ? 'bg-amber-500 text-slate-950'
                          : isTodaySunday
                          ? 'bg-purple-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {isTodayMissed ? 'Action Req' : isTodayDraft ? 'Draft' : isTodaySunday ? 'Holiday' : 'Done'}
                      </span>
                    </div>

                    {(isTodayMissed || isTodayDraft) && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setShowNotificationsDropdown(false);
                            handleOpenTodayAttendance();
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          Open Register <ChevronRight className="w-3 h-3" />
                        </button>
                        {isTodayMissed && (
                          <button
                            onClick={() => {
                              setShowNotificationsDropdown(false);
                              handleQuickMarkAllPresentAndPublish();
                            }}
                            disabled={quickSubmitting}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3 text-amber-300" /> Quick Mark All Present
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Status Item */}
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Roster Strength:
                    </span>
                    <strong className="text-white">{students.length} Students in Sec {selectedSection}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Active Homework:
                    </span>
                    <strong className="text-white">{homeworkList.length} Tasks Published</strong>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow ml-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* 🔔 ATTENDANCE NOTIFICATION SYSTEM ALERT BANNER */}
        {!isTodaySunday && isTodayMissed && !dismissedTodayAlert && (
          <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-3xl p-5 shadow-lg border-2 border-rose-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-amber-200">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white text-rose-700 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ATTENDANCE ALERT
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Attendance Not Submitted For Today ({todayDateStr})
                  </h3>
                </div>
                <p className="text-xs text-rose-100 font-medium max-w-2xl">
                  Daily attendance for <strong>Class {selectedClass}-{selectedSection}</strong> has not been recorded yet. Please submit now so student attendance logs, parental dashboards, and working day percentages remain accurate.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              <button
                onClick={handleQuickMarkAllPresentAndPublish}
                disabled={quickSubmitting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-950" />
                {quickSubmitting ? 'Publishing...' : '⚡ Quick Mark All Present'}
              </button>
              <button
                onClick={handleOpenTodayAttendance}
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                Open Register
              </button>
              <button
                onClick={() => setDismissedTodayAlert(true)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="Dismiss alert for now"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* DRAFT ATTENDANCE PENDING BANNER */}
        {!isTodaySunday && isTodayDraft && !dismissedTodayAlert && (
          <div className="bg-amber-500/15 border-2 border-amber-500/60 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-900 dark:text-amber-100">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                    DRAFT SAVED
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-200">
                    Today's Attendance ({todayDateStr}) Is Saved As Draft
                  </h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  Class {selectedClass}-{selectedSection} attendance has been drafted, but not published yet. Publish it so students and parents can see it.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
              <button
                onClick={handleOpenTodayAttendance}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" /> Review & Publish
              </button>
              <button
                onClick={() => setDismissedTodayAlert(true)}
                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 rounded-xl"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ATTENDANCE COMPLETED TODAY RIBBON */}
        {isTodayPublished && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="p-1 bg-emerald-500 text-slate-950 font-black rounded-lg text-[10px] flex-shrink-0">
                ✓ SUBMITTED
              </span>
              <span>
                Today's attendance (<strong>{todayDateStr}</strong>) is recorded and published for <strong>Class {selectedClass}-{selectedSection}</strong> ({todayAttendanceRecords.filter(r => r.status === 'Present').length} Present, {todayAttendanceRecords.filter(r => r.status === 'Absent').length} Absent, {todayAttendanceRecords.filter(r => r.status === 'Leave').length} Leave).
              </span>
            </div>
            <button
              onClick={handleOpenTodayAttendance}
              className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 flex-shrink-0"
            >
              View Register →
            </button>
          </div>
        )}

        {/* Publishing Target Scope Indicator Banner */}
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 font-medium shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex-shrink-0">
              CLASS & SECTION SCOPE
            </span>
            <span>
              All published <strong>Homework, Online Classes, Resources, Diaries, Syllabus & Announcements</strong> are targeted strictly to students of <strong>Class {selectedClass} - Section {selectedSection}</strong>.
            </span>
          </div>
          <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 rounded-lg border border-emerald-500/30">
            ✓ Target Protection Active
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Teacher Workspace Tools Grid
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">18 Editable Features</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {TOOLS_LIST.map(tool => {
              const IconComp = tool.icon;
              const isActive = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleSwitchTab(tool.id)}
                  className={`p-2.5 sm:p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[84px] sm:min-h-[92px] relative cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                      : 'bg-stone-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tool.alert && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                  <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-slate-950' : tool.color}`} />
                  <div>
                    <span className="block leading-tight text-[11px] sm:text-xs">{tool.title}</span>
                    <span className={`text-[9px] sm:text-[10px] font-normal block ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {tool.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll Target Anchor for smooth transition to output */}
        <div ref={activeContentRef} className="scroll-mt-6" />

        {/* Tool 1: Homework Hub (DEFAULT SELECTED) */}
        {activeTab === 'homework' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Homework & Assignment Publisher
                </h3>
                <p className="text-xs text-slate-500">Post daily homework tasks for Class {selectedClass}-{selectedSection}</p>
              </div>
            </div>

            <form onSubmit={handleCreateHomework} className="p-5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs font-medium">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Create New Homework Task</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Subject</label>
                  <select
                    value={newHw.subject}
                    onChange={e => setNewHw({ ...newHw, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    {['Mathematics', 'Science', 'SST', 'Computer', 'Hindi', 'English', 'Sanskrit/Urdu'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={newHw.title}
                    onChange={e => setNewHw({ ...newHw, title: e.target.value })}
                    placeholder="e.g. Exercise 3.2 Quadratic Equations"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Submission Due Date</label>
                  <input
                    type="date"
                    required
                    value={newHw.dueDate}
                    onChange={e => setNewHw({ ...newHw, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Task Instructions & Description</label>
                <textarea
                  rows={2}
                  required
                  value={newHw.description}
                  onChange={e => setNewHw({ ...newHw, description: e.target.value })}
                  placeholder="Complete Q1 to Q10 in homework copy and bring tomorrow."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Publish Homework Task
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Active Class Homework ({homeworkList.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {homeworkList.map(hw => (
                  <div key={hw.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-start gap-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] rounded-lg">
                          {hw.subject}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">Due: {hw.dueDate}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs">{hw.title}</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{hw.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHomework(hw.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                      title="Delete Homework"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tool 2: Attendance Manager */}
        {activeTab === 'attendance' && (() => {
          const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
          const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;
          const lateCount = Object.values(attendanceMap).filter(s => s === 'Late').length;
          const leaveCount = Object.values(attendanceMap).filter(s => s === 'Leave').length;
          const holidayCount = Object.values(attendanceMap).filter(s => s === 'Holiday').length;

          // Monthly Summary Calculations for Class based on calendar month
          const [sumYearStr, sumMonthStr] = summaryMonth.split('-');
          const sumYear = parseInt(sumYearStr, 10);
          const sumMonth = parseInt(sumMonthStr, 10);
          const totalDaysInMonth = new Date(sumYear, sumMonth, 0).getDate();
          const todayStr = new Date().toISOString().split('T')[0];

          // Generate all dates in selected month
          const allMonthDates: string[] = [];
          for (let i = 1; i <= totalDaysInMonth; i++) {
            const dStr = String(i).padStart(2, '0');
            allMonthDates.push(`${summaryMonth}-${dStr}`);
          }

          const monthRecords = allClassAttendance.filter(a => a.date && a.date.startsWith(summaryMonth));
          
          // Sundays & Holidays in month
          const monthSundayDates = allMonthDates.filter(d => new Date(`${d}T00:00:00`).getDay() === 0);
          const customHolidayDates = Array.from(new Set(monthRecords.filter(r => r.status === 'Holiday').map(r => r.date)));
          const allHolidayDates = Array.from(new Set([...monthSundayDates, ...customHolidayDates]));

          // Instructional working days in the full calendar month
          const totalCalendarWorkingDays = Math.max(1, allMonthDates.length - allHolidayDates.length);
          
          // Dates marked by teacher
          const teacherMarkedDates = Array.from(new Set(monthRecords.map(a => a.date))).filter(d => !monthSundayDates.includes(d));
          const notMentionedDatesCount = Math.max(0, allMonthDates.filter(d => d <= todayStr && !allHolidayDates.includes(d)).length - teacherMarkedDates.length);

          const studentMonthlySummaries = students.map(st => {
            const stRecords = monthRecords.filter(a => a.studentId === st.id);
            const p = stRecords.filter(a => a.status === 'Present').length;
            const l = stRecords.filter(a => a.status === 'Late').length;
            const ab = stRecords.filter(a => a.status === 'Absent').length;
            const lv = stRecords.filter(a => a.status === 'Leave').length;
            const h = allHolidayDates.length;
            const markedDays = p + l + ab + lv;
            const notMentioned = Math.max(0, totalCalendarWorkingDays - markedDays);
            const totalAtt = p + l;
            const pct = markedDays > 0 ? Number(((totalAtt / markedDays) * 100).toFixed(1)) : 100;
            return {
              student: st,
              logged: markedDays,
              holidays: h,
              workingDays: totalCalendarWorkingDays,
              markedDays,
              notMentioned,
              present: p,
              late: l,
              absent: ab,
              leave: lv,
              totalAtt,
              pct
            };
          });

          const totalMonthWorkingDays = totalCalendarWorkingDays;
          const monthHolidayDates = allHolidayDates;
          const monthUniqueDates = Array.from(new Set([...monthRecords.map(a => a.date), ...monthSundayDates]));

          const classAvgPct = studentMonthlySummaries.length > 0
            ? (studentMonthlySummaries.reduce((acc, curr) => acc + curr.pct, 0) / studentMonthlySummaries.length).toFixed(1)
            : '0.0';

          const lowAttCount = studentMonthlySummaries.filter(s => s.pct < 75).length;

          // Format month display name
          const monthDisplayNames: Record<string, string> = {
            '2026-01': 'January 2026',
            '2026-02': 'February 2026',
            '2026-03': 'March 2026',
            '2026-04': 'April 2026',
            '2026-05': 'May 2026',
            '2026-06': 'June 2026',
            '2026-07': 'July 2026',
            '2026-08': 'August 2026',
            '2026-09': 'September 2026',
            '2026-10': 'October 2026',
            '2026-11': 'November 2026',
            '2026-12': 'December 2026'
          };
          const currentMonthLabel = monthDisplayNames[summaryMonth] || summaryMonth;

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header & Sub-Tab Switcher */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" /> Class {selectedClass}-{selectedSection} Attendance Register
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Daily attendance entry & monthly class summary reporting</p>
                </div>

                <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setAttendanceViewMode('daily')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      attendanceViewMode === 'daily'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Daily Register
                  </button>
                  <button
                    onClick={() => setAttendanceViewMode('monthly')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      attendanceViewMode === 'monthly'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Monthly Summary Generator
                  </button>
                </div>
              </div>

              {/* VIEW 1: DAILY ATTENDANCE REGISTER */}
              {attendanceViewMode === 'daily' && (() => {
                const dateRecords = allClassAttendance.filter(a => a.date === attendanceDate);
                const isPublishedToday = dateRecords.length > 0 && dateRecords.some(a => a.isPublished);
                const publishedTeacherName = dateRecords.find(a => a.teacherName)?.teacherName || teacher?.name || 'Class Teacher';

                return (
                  <div className="space-y-6">
                    {/* Official Registration Banner */}
                    {isSunday ? (
                      <div className="p-4 bg-purple-500/10 border-2 border-purple-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-purple-600 text-white font-black rounded-xl text-[10px] uppercase">Official Holiday</span>
                          <span>Sunday is an Official Weekly Holiday. Attendance is automatically marked as Holiday for all students.</span>
                        </div>
                      </div>
                    ) : isPublishedToday ? (
                      <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>REGISTERED & PUBLISHED: Attendance for {attendanceDate} has been published by {publishedTeacherName}. Visible on Student and Parent dashboards.</span>
                        </div>
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-[10px] uppercase font-black">Published ✓</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 font-bold">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <span>NOT PUBLISHED YET: Daily attendance for {attendanceDate} is currently in draft. Please click "Publish Daily Attendance" to release to students/parents.</span>
                        </div>
                        <span className="px-3 py-1 bg-amber-600 text-white rounded-xl text-[10px] uppercase font-black">Draft / Unpublished</span>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-stone-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Selected Register Date:</span>
                        <p className="text-[11px] text-slate-500">Pick or step through dates to view or record class attendance</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Day Stepper Buttons */}
                        <div className="flex items-center bg-white dark:bg-slate-850 rounded-xl border border-slate-300 dark:border-slate-700 p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(attendanceDate + 'T00:00:00');
                              d.setDate(d.getDate() - 1);
                              handleAttendanceDateChange(d.toISOString().split('T')[0]);
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Previous Day"
                          >
                            ← Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceDateChange(todayDateStr)}
                            className="px-2.5 py-1.5 text-xs font-black text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(attendanceDate + 'T00:00:00');
                              d.setDate(d.getDate() + 1);
                              handleAttendanceDateChange(d.toISOString().split('T')[0]);
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Next Day"
                          >
                            Next →
                          </button>
                        </div>

                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={e => handleAttendanceDateChange(e.target.value)}
                          className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        />
                        <button
                          onClick={() => handleSaveAttendance(false)}
                          className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 active:scale-95 active:shadow-inner text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer select-none"
                        >
                          <Save className="w-4 h-4" /> Save Draft
                        </button>
                        <button
                          onClick={() => handleSaveAttendance(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:shadow-inner text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer select-none ring-2 ring-emerald-500/50"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Publish Daily Attendance
                        </button>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-bold">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                      Present: {presentCount}
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
                      Absent: {absentCount}
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
                      Late: {lateCount}
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300">
                      Leave: {leaveCount}
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                      <span>🌴 Holiday:</span> <span>{holidayCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50">
                    <span className="text-xs font-extrabold text-purple-900 dark:text-purple-300">Quick Bulk Class Actions:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const newMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
                          students.forEach(s => newMap[s.id] = 'Present');
                          setAttendanceMap(newMap);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:shadow-inner text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs cursor-pointer select-none"
                      >
                        ✓ Mark All Present
                      </button>
                      <button
                        onClick={() => {
                          const newMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
                          students.forEach(s => newMap[s.id] = 'Absent');
                          setAttendanceMap(newMap);
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 active:shadow-inner text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs cursor-pointer select-none"
                      >
                        ✕ Mark All Absent
                      </button>
                      <button
                        onClick={() => {
                          const newMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
                          students.forEach(s => newMap[s.id] = 'Holiday');
                          setAttendanceMap(newMap);
                        }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 active:shadow-inner text-white font-black text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer select-none"
                      >
                        🌴 Mark as Holiday
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {students.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">No students registered in Class {selectedClass}-{selectedSection}.</div>
                    ) : (
                      students.map(st => (
                        <div key={st.id} className="p-3 bg-stone-50 dark:bg-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-stone-100 dark:hover:bg-slate-800/80 transition-colors">
                          <span className="font-bold text-slate-900 dark:text-white">Roll No. {st.rollNo} — {st.name}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(['Present', 'Absent', 'Late', 'Leave', 'Holiday'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => setAttendanceMap({ ...attendanceMap, [st.id]: status })}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all active:scale-90 active:shadow-inner cursor-pointer select-none ${
                                  attendanceMap[st.id] === status
                                    ? status === 'Holiday'
                                      ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                                      : status === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                      : status === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                                      : status === 'Late'
                                      ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400'
                                      : 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-xs'
                                }`}
                              >
                                {status === 'Holiday' ? '🌴 Holiday' : status}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

              {/* VIEW 2: MONTHLY ATTENDANCE SUMMARY GENERATOR */}
              {attendanceViewMode === 'monthly' && (
                <div className="space-y-6">
                  {/* Controls Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-purple-50/60 dark:bg-purple-950/30 p-5 rounded-3xl border border-purple-200 dark:border-purple-900/50">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                        Monthly Report Generator
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                        Class {selectedClass}-{selectedSection} Attendance Summary for {currentMonthLabel}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Automatically calculates working instructional days excluding official school holidays.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Select Month</label>
                        <select
                          value={summaryMonth}
                          onChange={e => setSummaryMonth(e.target.value)}
                          className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        >
                          <option value="2026-01">January 2026</option>
                          <option value="2026-02">February 2026</option>
                          <option value="2026-03">March 2026</option>
                          <option value="2026-04">April 2026</option>
                          <option value="2026-05">May 2026</option>
                          <option value="2026-06">June 2026</option>
                          <option value="2026-07">July 2026</option>
                          <option value="2026-08">August 2026</option>
                          <option value="2026-09">September 2026</option>
                          <option value="2026-10">October 2026</option>
                          <option value="2026-11">November 2026</option>
                          <option value="2026-12">December 2026</option>
                        </select>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <button
                          onClick={() => downloadElementAsPDF(`monthly-attendance-report-${selectedClass}-${selectedSection}-${summaryMonth}`, `Monthly_Attendance_Class_${selectedClass}_${selectedSection}_${summaryMonth}.pdf`)}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export Summary PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Class Summary KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="bg-stone-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Days Logged</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">{monthUniqueDates.length} Days</div>
                      <p className="text-[10px] text-slate-500">All marked sessions</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">School Holidays</span>
                      <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-heading flex items-center justify-center gap-1">
                        🌴 {monthHolidayDates.length}
                      </div>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">Declared holidays</p>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Working Days</span>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-heading">{totalMonthWorkingDays} Days</div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Instructional days</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400">Class Average</span>
                      <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-heading">{classAvgPct}%</div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">Monthly attendance</p>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Low Attendance</span>
                      <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-heading">{lowAttCount} Students</div>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400">Below 75% threshold</p>
                    </div>
                  </div>

                  {/* Printable Monthly Summary Report Printable Element */}
                  <div
                    id={`monthly-attendance-report-${selectedClass}-${selectedSection}-${summaryMonth}`}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-6"
                  >
                    {/* Official Report Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow">
                          MPS
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                            MODEL PUBLIC SCHOOL (MPS SIKTA)
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            Official Class Monthly Attendance Register — {currentMonthLabel}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-300">
                          Class {selectedClass} - Section {selectedSection}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Class Teacher: {teacher?.name || 'Class Teacher'}</p>
                      </div>
                    </div>

                    {/* Table Roster */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5 rounded-l-xl">Roll No</th>
                            <th className="p-2.5">Student Name</th>
                            <th className="p-2.5 text-center">Total Logged</th>
                            <th className="p-2.5 text-center text-purple-700 dark:text-purple-300">Holidays 🌴</th>
                            <th className="p-2.5 text-center text-emerald-700 dark:text-emerald-300">Working Days</th>
                            <th className="p-2.5 text-center">Present</th>
                            <th className="p-2.5 text-center">Late</th>
                            <th className="p-2.5 text-center text-rose-600">Absent</th>
                            <th className="p-2.5 text-center text-blue-600">Leave</th>
                            <th className="p-2.5 text-center">Effective %</th>
                            <th className="p-2.5 rounded-r-xl text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                          {studentMonthlySummaries.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="p-8 text-center text-slate-400">No student records found for Class {selectedClass}-{selectedSection}.</td>
                            </tr>
                          ) : (
                            studentMonthlySummaries.map(({ student, logged, holidays, workingDays, present, late, absent, leave, totalAtt, pct }) => (
                              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{student.rollNo}</td>
                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{student.name}</td>
                                <td className="p-2.5 text-center">{logged}</td>
                                <td className="p-2.5 text-center font-bold text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30">{holidays}</td>
                                <td className="p-2.5 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30">{workingDays}</td>
                                <td className="p-2.5 text-center text-emerald-600 font-bold">{present}</td>
                                <td className="p-2.5 text-center text-amber-600 font-bold">{late}</td>
                                <td className="p-2.5 text-center text-rose-600 font-bold">{absent}</td>
                                <td className="p-2.5 text-center text-blue-600 font-bold">{leave}</td>
                                <td className="p-2.5 text-center font-black text-slate-900 dark:text-white">{pct}%</td>
                                <td className="p-2.5 text-center">
                                  {pct >= 85 ? (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300">
                                      EXCELLENT
                                    </span>
                                  ) : pct >= 75 ? (
                                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-300">
                                      ELIGIBLE
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-300">
                                      LOW ATTENDANCE
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Footer Note */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          * Note: School holidays declared by management are automatically excluded from working instructional days calculation as per CBSE regulations.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} via MPS Sikta Teacher Portal.</p>
                      </div>

                      <div className="flex gap-8 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 pt-2">
                        <div>
                          <div className="border-b border-slate-400 w-28 mb-1"></div>
                          <span>Class Teacher Signature</span>
                        </div>
                        <div>
                          <div className="border-b border-slate-400 w-28 mb-1"></div>
                          <span>Principal Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tool 3: School Diary & Teacher Notes */}
        {activeTab === 'diary' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Notebook className="w-5 h-5 text-blue-500" /> School Diary & Teacher Notes
            </h3>

            <form onSubmit={handleCreateDiaryEntry} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Subject / Category"
                  value={newDiaryNote.subject}
                  onChange={e => setNewDiaryNote({ ...newDiaryNote, subject: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  required
                  placeholder="Note Title"
                  value={newDiaryNote.title}
                  onChange={e => setNewDiaryNote({ ...newDiaryNote, title: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
              </div>
              <textarea
                rows={2}
                required
                placeholder="Write teacher note or daily instruction for parent diary..."
                value={newDiaryNote.content}
                onChange={e => setNewDiaryNote({ ...newDiaryNote, content: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                Post Diary Note
              </button>
            </form>

            <div className="space-y-2">
              {schoolDiaryList.map((note, idx) => (
                <div key={note.id || idx} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>{note.title} ({note.subject})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{note.date}</span>
                      <button onClick={() => setEditingDiaryEntry(note)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Edit Note"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteDiaryEntry(note.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete Note"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 4: Study Material */}
        {activeTab === 'study-material' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" /> Study Material & Chapter PDFs
            </h3>

            <form onSubmit={handleCreateStudyMaterial} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Material Title"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  required
                  placeholder="PDF URL / Drive Link"
                  value={newMaterial.fileUrl}
                  onChange={e => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                Upload Study Material
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studyMaterialsList.map((sm, idx) => (
                <div key={sm.id || idx} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{sm.title}</h4>
                    <p className="text-slate-500">{sm.subject}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <a href={sm.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-500 font-bold">
                      <ExternalLink className="w-3.5 h-3.5" /> View PDF
                    </a>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingStudyMaterial(sm)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteStudyMaterial(sm.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 5: Online Classes */}
        {activeTab === 'online-classes' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-500" /> Zoom Online Live Classes
            </h3>

            <form onSubmit={handleCreateOnlineClass} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Class Title"
                  value={newClassForm.title}
                  onChange={e => setNewClassForm({ ...newClassForm, title: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  required
                  placeholder="Zoom URL"
                  value={newClassForm.zoomUrl}
                  onChange={e => setNewClassForm({ ...newClassForm, zoomUrl: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Schedule Online Class
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {onlineClassesList.map(oc => (
                <div key={oc.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{oc.title} ({oc.subject})</h4>
                    <p className="text-slate-500">Meeting ID: {oc.meetingId} | Passcode: {oc.passcode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={oc.zoomUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold">
                      Join Zoom
                    </a>
                    <button onClick={() => setEditingOnlineClass(oc)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteOnlineClass(oc.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 6: Online Exams */}
        {activeTab === 'online-exams' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-rose-500" /> Online Examinations & Proctoring
            </h3>

            <form onSubmit={handleCreateOnlineExam} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Exam Title"
                  value={newExamForm.title}
                  onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="date"
                  required
                  value={newExamForm.date}
                  onChange={e => setNewExamForm({ ...newExamForm, date: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Schedule Exam
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {onlineExamsList.map(oe => (
                <div key={oe.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{oe.title} ({oe.subject})</h4>
                    <p className="text-slate-500">Date: {oe.date} | Total Marks: {oe.totalMarks} | Duration: {oe.durationMinutes}m</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingOnlineExam(oe)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteOnlineExam(oe.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 7: Time Table */}
        {activeTab === 'timetable' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" /> Time Table & Period Schedule
            </h3>

            <form onSubmit={handleCreateTimeTableSlot} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Subject"
                  value={newSlot.subject}
                  onChange={e => setNewSlot({ ...newSlot, subject: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  required
                  placeholder="Time Range (e.g. 09:00 - 09:45 AM)"
                  value={newSlot.startTime}
                  onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Add Period Slot
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {timeTableList.map((tt, idx) => (
                <div key={tt.id || idx} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-start">
                  <div>
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-600 font-extrabold text-[10px] rounded-lg">
                      {tt.day} - Period {tt.periodNo}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-1">{tt.subject}</h4>
                    <p className="text-slate-500">{tt.startTime} - {tt.endTime}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingTimeTableSlot(tt)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteTimeTableSlot(tt.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 8: Messages */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" /> Broadcast Messages & Parent Circulars
            </h3>

            <form onSubmit={handleSendMessage} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Message Title / Headline"
                value={newMessageText.title}
                onChange={e => setNewMessageText({ ...newMessageText, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
              />
              <textarea
                rows={2}
                required
                placeholder="Message details to broadcast to student portal..."
                value={newMessageText.content}
                onChange={e => setNewMessageText({ ...newMessageText, content: e.target.value })}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Send Broadcast Message
              </button>
            </form>

            <div className="space-y-2">
              {messagesList.map((m, idx) => (
                <div key={m.id || idx} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white">{m.title}</h4>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingMessage(m)} className="p-1 text-sky-500 hover:bg-sky-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteMessage(m.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{m.content}</p>
                  {m.reply && <p className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">Teacher Reply: {m.reply}</p>}
                  <span className="text-[10px] text-slate-400 mt-2 block">{m.date} | Sender: {m.sender} ({m.senderRole || 'Teacher'})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 9: Course Syllabus */}
        {activeTab === 'syllabus' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-600" /> Course Syllabus & Chapter Progress Tracker
            </h3>

            <form onSubmit={handleCreateSyllabusItem} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Chapter Name"
                  value={newSyllabusItem.chapterName}
                  onChange={e => setNewSyllabusItem({ ...newSyllabusItem, chapterName: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <select
                  value={newSyllabusItem.status}
                  onChange={e => setNewSyllabusItem({ ...newSyllabusItem, status: e.target.value as any })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Update Chapter Status
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {syllabusList.map((s, idx) => (
                <div key={s.id || idx} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{s.chapterName}</h4>
                    <p className="text-slate-500">{s.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      s.status === 'Completed' ? 'bg-emerald-500 text-slate-950' : s.status === 'In Progress' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {s.status}
                    </span>
                    <button onClick={() => setEditingSyllabusItem(s)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteSyllabusItem(s.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool 10: Marksheets & Gradebook Entry Studio */}
        {activeTab === 'marks' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Gradebook & Marksheet Publishing Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Publish official report cards with configurable full marks (100, 25, or custom), subject weights, and auto grades for Class {selectedClass}-{selectedSection}
                </p>
              </div>

              {selectedExamStudent && (
                <button
                  type="button"
                  onClick={() => setSelectedExamStudent(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  ← Select Different Student
                </button>
              )}
            </div>

            {/* Student Selector Cards */}
            {!selectedExamStudent ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search student by name or roll number..."
                      value={marksheetSearch}
                      onChange={e => setMarksheetSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-bold self-center">
                    {students.length} Students in Class {selectedClass}-{selectedSection}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {students
                    .filter(st =>
                      st.name.toLowerCase().includes(marksheetSearch.toLowerCase()) ||
                      st.rollNo.toLowerCase().includes(marksheetSearch.toLowerCase())
                    )
                    .map(st => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedExamStudent(st);
                          // Initialize subjects with current default full marks
                          setSubjectsList(
                            DEFAULT_SUBJECTS.map(s => ({
                              ...s,
                              maxMarks: defaultFullMarks,
                              marksObtained: Math.min(s.marksObtained, defaultFullMarks),
                              grade: calculateGrade(Math.min(s.marksObtained, defaultFullMarks), defaultFullMarks)
                            }))
                          );
                        }}
                        className="p-3.5 bg-stone-50 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {st.photo ? (
                            <img
                              src={st.photo}
                              alt={st.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                              #{st.rollNo}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate group-hover:text-amber-500 transition-colors">
                              {st.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              Roll No: <strong className="text-slate-700 dark:text-slate-300 font-mono">{st.rollNo}</strong> • Class {st.class}-{st.section}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 bg-amber-500 group-hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 transition-all"
                        >
                          Enter Marks
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* MARK ENTRY STUDIO FOR SELECTED STUDENT */
              <form onSubmit={handleSaveMarks} className="space-y-6">
                {/* Student Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent dark:from-amber-950/40 dark:via-indigo-950/30 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedExamStudent.photo ? (
                      <img
                        src={selectedExamStudent.photo}
                        alt={selectedExamStudent.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center shadow">
                        #{selectedExamStudent.rollNo}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {selectedExamStudent.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] rounded-full border border-indigo-500/20">
                          Class {selectedExamStudent.class}-{selectedExamStudent.section}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Roll: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedExamStudent.rollNo}</span>
                        {selectedExamStudent.parentName && ` • Parent: ${selectedExamStudent.parentName}`}
                        {selectedExamStudent.enrollmentNo && ` • Reg: ${selectedExamStudent.enrollmentNo}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/30">
                      Academic Year 2025-2026
                    </span>
                  </div>
                </div>

                {/* Exam Title Selector & Presets */}
                <div className="p-4 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" /> Examination / Assessment Name *
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={isCustomExam}
                        onChange={e => setIsCustomExam(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      Custom Exam Name
                    </label>
                  </div>

                  {isCustomExam ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unit Test 1 (July 2026), Weekly Surprise Test..."
                      value={customExamType}
                      onChange={e => setCustomExamType(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={examType}
                        onChange={e => {
                          const val = e.target.value;
                          setExamType(val);
                          // Suggest appropriate default full marks based on exam type
                          if (val.includes('Unit Test') || val.includes('Weekly')) {
                            handleApplyFullMarksToAll(25);
                          } else if (val.includes('Periodic') || val.includes('PT-')) {
                            handleApplyFullMarksToAll(50);
                          } else if (val.includes('Annual') || val.includes('Board') || val.includes('Half Yearly')) {
                            handleApplyFullMarksToAll(100);
                          }
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="Unit Test 1 (25 Marks)">Unit Test 1 (25 Marks)</option>
                        <option value="Unit Test 2 (25 Marks)">Unit Test 2 (25 Marks)</option>
                        <option value="Weekly Class Test (20 Marks)">Weekly Class Test (20 Marks)</option>
                        <option value="Periodic Test 1 (PT-1 - 50 Marks)">Periodic Test 1 (PT-1 - 50 Marks)</option>
                        <option value="Periodic Test 2 (PT-2 - 50 Marks)">Periodic Test 2 (PT-2 - 50 Marks)</option>
                        <option value="Half-Yearly Examination (80/100 Marks)">Half-Yearly Examination (80/100 Marks)</option>
                        <option value="Mid-Term Examination (100 Marks)">Mid-Term Examination (100 Marks)</option>
                        <option value="Pre-Board Examination (100 Marks)">Pre-Board Examination (100 Marks)</option>
                        <option value="Annual Final Examination (100 Marks)">Annual Final Examination (100 Marks)</option>
                      </select>

                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold self-center">Quick Select:</span>
                        {[
                          { label: 'Unit Test 1 (25M)', full: 25 },
                          { label: 'Unit Test 2 (25M)', full: 25 },
                          { label: 'PT-1 (50M)', full: 50 },
                          { label: 'Half Yearly (100M)', full: 100 },
                          { label: 'Annual Final (100M)', full: 100 }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setExamType(p.label);
                              setIsCustomExam(false);
                              handleApplyFullMarksToAll(p.full);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              examType === p.label && !isCustomExam
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* FULL MARKS SELECTION BAR (Default 100, 25, or Custom) */}
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-transparent dark:bg-indigo-950/20 rounded-2xl border border-indigo-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-500" /> Full Marks / Max Marks Setting (Batch Default)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Choose standard maximum score (e.g. 100 for finals, 25 for unit tests, or custom value) to apply across all subjects
                      </p>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                      Standard: {defaultFullMarks} Marks
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Standard Presets:</span>
                    {[100, 80, 75, 50, 40, 25, 20].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleApplyFullMarksToAll(amt)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                          defaultFullMarks === amt
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {amt} Marks
                      </button>
                    ))}

                    <div className="flex items-center gap-1.5 ml-auto w-full sm:w-auto pt-2 sm:pt-0">
                      <span className="text-xs text-slate-500 font-bold">Custom Full Marks:</span>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={customFullMarksInput}
                        onChange={e => setCustomFullMarksInput(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-20 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-black text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyFullMarksToAll(Number(customFullMarksInput) || 100)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subject-Wise Marks Entry Table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-500" /> Subject-wise Score Breakdown
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {subjectsList.length} Subjects Configured
                    </span>
                  </div>

                  {/* Responsive Grid for Subjects */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subjectsList.map((subj, idx) => {
                      const max = Number(subj.maxMarks) || defaultFullMarks;
                      const obt = Number(subj.marksObtained) || 0;
                      const pct = max > 0 ? Math.round((obt / max) * 100) : 0;
                      const isPassing = pct >= 33;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={subj.subject}
                              onChange={e => {
                                const updated = [...subjectsList];
                                updated[idx].subject = e.target.value;
                                setSubjectsList(updated);
                              }}
                              className="font-black text-xs text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-amber-400 outline-none pb-0.5 flex-1"
                            />
                            
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 text-[11px] font-black rounded-lg border ${
                                  isPassing
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {subj.grade || calculateGrade(obt, max)} ({pct}%)
                              </span>

                              {subjectsList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjectsList(subjectsList.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                  title="Remove Subject"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold mb-1">
                                Full / Max Marks
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={subj.maxMarks || defaultFullMarks}
                                onChange={e => {
                                  const updated = [...subjectsList];
                                  const newMax = Math.max(1, Number(e.target.value) || 1);
                                  updated[idx].maxMarks = newMax;
                                  updated[idx].marksObtained = Math.min(Number(updated[idx].marksObtained) || 0, newMax);
                                  updated[idx].grade = calculateGrade(updated[idx].marksObtained, newMax);
                                  setSubjectsList(updated);
                                }}
                                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-center text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold mb-1">
                                Marks Obtained *
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={subj.maxMarks || defaultFullMarks}
                                value={subj.marksObtained}
                                onChange={e => {
                                  const updated = [...subjectsList];
                                  const currentMax = Number(updated[idx].maxMarks) || defaultFullMarks;
                                  const rawVal = Number(e.target.value);
                                  const clampedVal = Math.min(Math.max(0, rawVal), currentMax);
                                  updated[idx].marksObtained = clampedVal;
                                  updated[idx].grade = calculateGrade(clampedVal, currentMax);
                                  setSubjectsList(updated);
                                }}
                                className="w-full p-2 bg-white dark:bg-slate-900 border-2 border-amber-400/60 dark:border-amber-500/60 rounded-xl font-mono font-black text-center text-slate-900 dark:text-white text-sm focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Extra Subject */}
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add custom subject (e.g. Drawing, Moral Science, General Knowledge)..."
                        value={newSubjectInput}
                        onChange={e => setNewSubjectInput(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubjectInput.trim()) {
                            setSubjectsList([
                              ...subjectsList,
                              {
                                subject: newSubjectInput.trim(),
                                maxMarks: defaultFullMarks,
                                marksObtained: Math.round(defaultFullMarks * 0.8),
                                grade: calculateGrade(Math.round(defaultFullMarks * 0.8), defaultFullMarks)
                              }
                            ]);
                            setNewSubjectInput('');
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Subject
                      </button>
                    </div>

                    {/* Pre-made subject chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold self-center">Quick Add:</span>
                      {['Drawing / Art', 'Moral Science', 'General Knowledge', 'Physical Education', 'EVS'].map(sName => (
                        <button
                          key={sName}
                          type="button"
                          onClick={() => {
                            if (!subjectsList.some(s => s.subject.toLowerCase() === sName.toLowerCase())) {
                              setSubjectsList([
                                ...subjectsList,
                                {
                                  subject: sName,
                                  maxMarks: defaultFullMarks,
                                  marksObtained: Math.round(defaultFullMarks * 0.8),
                                  grade: calculateGrade(Math.round(defaultFullMarks * 0.8), defaultFullMarks)
                                }
                              ]);
                            }
                          }}
                          className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          + {sName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Scoreboard Summary */}
                {(() => {
                  const totalObtained = subjectsList.reduce((acc, curr) => acc + (Number(curr.marksObtained) || 0), 0);
                  const grandMax = subjectsList.reduce((acc, curr) => acc + (Number(curr.maxMarks) || defaultFullMarks), 0);
                  const overallPct = grandMax > 0 ? Math.round((totalObtained / grandMax) * 100) : 0;
                  const overallGrade = calculateGrade(totalObtained, grandMax);
                  const isPassed = overallPct >= 33;

                  return (
                    <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Official Result Summary Preview
                        </span>
                        <span
                          className={`px-3 py-0.5 rounded-full font-black text-xs border ${
                            isPassed
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isPassed ? '✓ PASSED' : '✕ NEEDS IMPROVEMENT'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-bold">Total Marks</span>
                          <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                            {totalObtained} / {grandMax}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-bold">Aggregate Percentage</span>
                          <span className="text-lg sm:text-xl font-black text-indigo-300 font-mono">
                            {overallPct}%
                          </span>
                        </div>
                        <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-bold">Final Grade</span>
                          <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                            {overallGrade}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block font-bold">Subjects Count</span>
                          <span className="text-lg sm:text-xl font-black text-white font-mono">
                            {subjectsList.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Teacher Remarks */}
                <div className="space-y-2">
                  <label className="block font-extrabold text-slate-900 dark:text-white text-xs">
                    Class Teacher / Academic Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={teacherRemarks}
                    onChange={e => setTeacherRemarks(e.target.value)}
                    placeholder="Enter teacher feedback for the student report card..."
                    className="w-full p-3 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {/* Quick remarks chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold self-center">Quick Remarks:</span>
                    {[
                      'Outstanding academic performance! Keep it up.',
                      'Very sincere and hard working student.',
                      'Good academic progress, shows great potential.',
                      'Needs improvement in mathematics and sciences.',
                      'Regular practice and revision recommended.'
                    ].map((rem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTeacherRemarks(rem)}
                        className="px-2 py-0.5 bg-stone-100 dark:bg-slate-800 hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 text-[10px] rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        {rem}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedExamStudent(null)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Publish & Save Marksheet to Student Portal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tool: Class Students Management */}
        {activeTab === 'students' && (() => {
          const filteredList = students.filter(s =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.parentName && s.parentName.toLowerCase().includes(studentSearch.toLowerCase())) ||
            (s.phone && s.phone.includes(studentSearch))
          );

          const feeClearedCount = students.filter(s => !s.feeInfo || (s.feeInfo.pending || 0) <= 0).length;
          const totalDuesSum = students.reduce((acc, curr) => acc + (curr.feeInfo?.pending || 0), 0);

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Class {selectedClass}-{selectedSection} Student Profiles & Registry
                  </h3>
                  <p className="text-xs text-slate-500">Add, edit, manage student login credentials, fee status, and parent records</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search student, roll, parent..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingStudent({
                        id: 'temp-' + Date.now(),
                        userId: 'MPS-' + Math.floor(10000 + Math.random() * 90000),
                        name: '',
                        rollNo: String(students.length + 1),
                        class: selectedClass,
                        section: selectedSection,
                        parentName: '',
                        phone: '',
                        address: '',
                        admissionDate: new Date().toISOString().split('T')[0],
                        password: '123',
                        feeInfo: { totalAnnual: 25100, paid: 0, pending: 25100, months: generateDefault12MonthFeeList(1100, 2026) }
                      });
                      setShowStudentModal(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 active:shadow-inner text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer select-none"
                  >
                    <UserPlus className="w-4 h-4" /> Add New Student
                  </button>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Enrolled Students</span>
                  <span className="text-xl font-extrabold">{students.length}</span>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Fee Cleared</span>
                  <span className="text-xl font-extrabold">{feeClearedCount}</span>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Dues Pending</span>
                  <span className="text-xl font-extrabold">₹{totalDuesSum.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-300">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Section Assigned</span>
                  <span className="text-xl font-extrabold">Class {selectedClass}-{selectedSection}</span>
                </div>
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredList.map(st => (
                  <div
                    key={st.id}
                    className="p-5 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 relative hover:border-indigo-400/80 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {st.photo ? (
                            <img
                              src={st.photo}
                              alt={st.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-300 dark:border-slate-600 shrink-0 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center shrink-0">
                              {st.rollNo || '#'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight truncate">{st.name}</h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                              Roll #{st.rollNo} • Class {st.class}-{st.section}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-500/20 shrink-0">
                          Active
                        </span>
                      </div>

                      {/* Facility Badges (Hostel & Transport) */}
                      {(st.hostelEnrolled || st.transportEnrolled) && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {st.hostelEnrolled && (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] rounded-lg border border-indigo-500/20 flex items-center gap-1">
                              <Home className="w-3 h-3" /> Hostel
                            </span>
                          )}
                          {st.transportEnrolled && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black text-[10px] rounded-lg border border-amber-500/20 flex items-center gap-1 truncate max-w-[200px]">
                              <Bus className="w-3 h-3" /> {st.transportRoute ? `Bus: ${st.transportRoute}` : 'School Bus'}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs space-y-1.5 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Parents:</span>
                          <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                            {st.parentName || 'N/A'}{st.motherName ? ` & ${st.motherName}` : ''}
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Phone:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{st.phone || 'N/A'}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Fee Balance:</span>
                          <strong className={(st.feeInfo?.pending || 0) > 0 ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-600 dark:text-emerald-400 font-extrabold"}>
                            ₹{(st.feeInfo?.pending || 0).toLocaleString('en-IN')}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setShowStudentModal(true);
                        }}
                        className="flex-1 py-1.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center justify-center gap-1 font-extrabold transition-all cursor-pointer"
                        title="Edit Student Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          setPassResetStudent(st);
                          setPassResetVal(st.password || st.rollNo + '123');
                        }}
                        className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 active:scale-95 text-slate-800 dark:text-slate-200 rounded-xl flex items-center gap-1 font-bold transition-all cursor-pointer"
                        title="Reset Student Login Password"
                      >
                        <Key className="w-3.5 h-3.5" /> Pass
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStudentForCard(st);
                          handleSwitchTab('idcard');
                        }}
                        className="py-1.5 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-1 font-bold transition-all cursor-pointer"
                        title="View Digital ID Pass"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> ID
                      </button>

                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 active:scale-90 rounded-xl transition-all cursor-pointer"
                        title="Delete Student Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredList.length === 0 && (
                <div className="text-center py-10 bg-stone-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
                  No student records found matching "{studentSearch}". Click "Add New Student" to create a profile.
                </div>
              )}
            </div>
          );
        })()}

        {/* Tool: Student & Parent Record Correction Requests */}
        {activeTab === 'corrections' && (() => {
          const pendingCorrections = recordUpdatesList.filter(r => r.status === 'Pending');
          const approvedCorrections = recordUpdatesList.filter(r => r.status === 'Approved');
          const rejectedCorrections = recordUpdatesList.filter(r => r.status === 'Rejected');

          const displayedCorrections = recordUpdatesList.filter(r => {
            if (correctionFilter === 'Pending') return r.status === 'Pending';
            if (correctionFilter === 'Approved') return r.status === 'Approved';
            if (correctionFilter === 'Rejected') return r.status === 'Rejected';
            return true;
          });

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-600" /> Student Profile & Record Correction Requests
                  </h3>
                  <p className="text-xs text-slate-500">Review, verify, and synchronize parent/student requested profile modifications to the database</p>
                </div>

                <button
                  onClick={() => setShowNewCorrectionModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 active:shadow-inner text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Log Correction Request
                </button>
              </div>

              {/* Status Filter Tabs & Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                <button
                  onClick={() => setCorrectionFilter('All')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    correctionFilter === 'All'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Total Requests</span>
                  <span className="text-xl font-extrabold">{recordUpdatesList.length}</span>
                </button>

                <button
                  onClick={() => setCorrectionFilter('Pending')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    correctionFilter === 'Pending'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Action Pending</span>
                  <span className="text-xl font-extrabold">{pendingCorrections.length}</span>
                </button>

                <button
                  onClick={() => setCorrectionFilter('Approved')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    correctionFilter === 'Approved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Approved & Synced</span>
                  <span className="text-xl font-extrabold">{approvedCorrections.length}</span>
                </button>

                <button
                  onClick={() => setCorrectionFilter('Rejected')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    correctionFilter === 'Rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Rejected</span>
                  <span className="text-xl font-extrabold">{rejectedCorrections.length}</span>
                </button>
              </div>

              {/* Correction List */}
              <div className="space-y-3">
                {displayedCorrections.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
                    No correction requests found for the selected filter.
                  </div>
                ) : (
                  displayedCorrections.map(req => (
                    <div
                      key={req.id}
                      className="p-5 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-300 transition-all shadow-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {req.studentName} {req.rollNo ? `(Roll #${req.rollNo})` : ''}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg">
                            Class {req.class || selectedClass}-{req.section || selectedSection}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              req.status === 'Approved'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                                : req.status === 'Rejected'
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 animate-pulse'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Field:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{req.field}</span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold block">Old Value:</span>
                              <span className="text-slate-500 line-through font-semibold text-[11px]">{req.oldValue || '—'}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <div>
                              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold block">New Value:</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px]">{req.newValue}</span>
                            </div>
                          </div>
                        </div>

                        {req.reason && (
                          <p className="text-[11px] text-slate-500 italic pt-1">
                            <strong>Reason/Note:</strong> "{req.reason}"
                          </p>
                        )}

                        {req.reviewedBy && (
                          <p className="text-[10px] text-slate-400 pt-0.5">
                            Reviewed by <strong>{req.reviewedBy}</strong> {req.reviewedAt ? `on ${new Date(req.reviewedAt).toLocaleDateString()}` : ''}
                            {req.actionNote ? ` • Note: ${req.actionNote}` : ''}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {req.status === 'Pending' && (
                        <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleApproveCorrection(req)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 active:shadow-inner text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Sync DB
                          </button>
                          <button
                            onClick={() => handleRejectCorrection(req)}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 active:scale-95 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
                          >
                            <XCircle className="w-4 h-4" /> Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Log Correction Modal */}
              {showNewCorrectionModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" /> Log Student Record Correction
                      </h4>
                      <button onClick={() => setShowNewCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateCorrection} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Select / Enter Student Name</label>
                        <select
                          value={newCorrectionForm.studentId}
                          onChange={e => {
                            const found = students.find(s => s.id === e.target.value);
                            setNewCorrectionForm({
                              ...newCorrectionForm,
                              studentId: e.target.value,
                              studentName: found ? found.name : '',
                              rollNo: found ? found.rollNo : ''
                            });
                          }}
                          className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                        >
                          <option value="">-- Choose Student from Class --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              Roll #{s.rollNo} - {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!newCorrectionForm.studentId && (
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Or Student Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={newCorrectionForm.studentName}
                            onChange={e => setNewCorrectionForm({ ...newCorrectionForm, studentName: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Field to Correct</label>
                        <select
                          value={newCorrectionForm.field}
                          onChange={e => setNewCorrectionForm({ ...newCorrectionForm, field: e.target.value })}
                          className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                        >
                          <option value="Parent Phone Number">Parent Phone Number</option>
                          <option value="Father / Guardian Name">Father / Guardian Name</option>
                          <option value="Permanent Home Address">Permanent Home Address</option>
                          <option value="Student Name Spelling">Student Name Spelling</option>
                          <option value="Date of Birth">Date of Birth</option>
                          <option value="Transport Bus Route">Transport Bus Route</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Old Value</label>
                          <input
                            type="text"
                            placeholder="Current incorrect value"
                            value={newCorrectionForm.oldValue}
                            onChange={e => setNewCorrectionForm({ ...newCorrectionForm, oldValue: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">New Value</label>
                          <input
                            type="text"
                            required
                            placeholder="Corrected value"
                            value={newCorrectionForm.newValue}
                            onChange={e => setNewCorrectionForm({ ...newCorrectionForm, newValue: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Reason / Notes</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Parent requested during PTM meeting"
                          value={newCorrectionForm.reason}
                          onChange={e => setNewCorrectionForm({ ...newCorrectionForm, reason: e.target.value })}
                          className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowNewCorrectionModal(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl font-extrabold shadow"
                        >
                          Submit Correction
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tool: Parent Complaints & Grievance Desk */}
        {activeTab === 'complaints' && (() => {
          const openComplaints = complaintsList.filter(c => c.status === 'Open');
          const underReviewComplaints = complaintsList.filter(c => c.status === 'Under Review');
          const resolvedComplaints = complaintsList.filter(c => c.status === 'Resolved');

          const displayedComplaints = complaintsList.filter(c => {
            const statusMatch =
              complaintFilter === 'All' ? true : c.status === complaintFilter;
            const categoryMatch =
              complaintCategoryFilter === 'All' ? true : c.category === complaintCategoryFilter;
            return statusMatch && categoryMatch;
          });

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquareWarning className="w-5 h-5 text-rose-500" /> Parent Grievances & Complaints Desk
                  </h3>
                  <p className="text-xs text-slate-500">Monitor parent concerns, view academic/bus grievances, and reply directly with official solutions</p>
                </div>

                <button
                  onClick={() => setShowNewComplaintModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 active:shadow-inner text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Register Parent Grievance
                </button>
              </div>

              {/* Status Filter Tabs & Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                <button
                  onClick={() => setComplaintFilter('All')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    complaintFilter === 'All'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Total Complaints</span>
                  <span className="text-xl font-extrabold">{complaintsList.length}</span>
                </button>

                <button
                  onClick={() => setComplaintFilter('Open')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    complaintFilter === 'Open'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Action Required (Open)</span>
                  <span className="text-xl font-extrabold">{openComplaints.length}</span>
                </button>

                <button
                  onClick={() => setComplaintFilter('Under Review')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    complaintFilter === 'Under Review'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Under Review</span>
                  <span className="text-xl font-extrabold">{underReviewComplaints.length}</span>
                </button>

                <button
                  onClick={() => setComplaintFilter('Resolved')}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                    complaintFilter === 'Resolved'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-stone-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] opacity-80 uppercase block font-bold">Resolved</span>
                  <span className="text-xl font-extrabold">{resolvedComplaints.length}</span>
                </button>
              </div>

              {/* Category Filter Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold">Category:</span>
                {['All', 'Teaching & Academics', 'Discipline & Behavior', 'Transport & Bus', 'Campus Cleanliness & Facilities', 'Fees & Accounts'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setComplaintCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all active:scale-95 cursor-pointer ${
                      complaintCategoryFilter === cat
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Complaints List */}
              <div className="space-y-4">
                {displayedComplaints.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
                    No parent complaints or grievances logged matching this filter.
                  </div>
                ) : (
                  displayedComplaints.map(cmp => (
                    <div
                      key={cmp.id}
                      className="p-5 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 hover:border-rose-300 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              cmp.priority === 'Urgent'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : cmp.priority === 'High'
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30'
                                : cmp.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30'
                                : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30'
                            }`}
                          >
                            {cmp.priority} Priority
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border">
                            {cmp.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(cmp.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={cmp.status}
                            onChange={e => handleUpdateComplaintStatus(cmp.id, e.target.value as any)}
                            className={`p-1 px-2.5 rounded-xl text-[11px] font-extrabold border ${
                              cmp.status === 'Resolved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                : cmp.status === 'Under Review'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
                            }`}
                          >
                            <option value="Open">Status: Open</option>
                            <option value="Under Review">Status: Under Review</option>
                            <option value="Resolved">Status: Resolved ✓</option>
                          </select>

                          <button
                            onClick={() => handleDeleteComplaint(cmp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                            title="Delete Complaint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{cmp.subject}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{cmp.description}</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Parent & Student Info:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {cmp.parentName} (Parent of <strong>{cmp.studentName}</strong>, Roll #{cmp.studentRollNo || '—'}, Class {cmp.class}-{cmp.section})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {cmp.phone && (
                            <a
                              href={`tel:${cmp.phone}`}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl flex items-center gap-1.5 text-[11px] transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5" /> Call Parent ({cmp.phone})
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedComplaintForReply(cmp);
                              setComplaintReplyText(cmp.teacherReply || '');
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold rounded-xl flex items-center gap-1.5 text-[11px] shadow transition-all cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" /> {cmp.teacherReply ? 'Edit Reply' : 'Send Solution Reply'}
                          </button>
                        </div>
                      </div>

                      {/* Official Teacher Resolution Note */}
                      {cmp.teacherReply && (
                        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1 text-[11px]">
                              <CheckCheck className="w-4 h-4 text-emerald-600" /> Official Teacher / School Reply:
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                              By {cmp.repliedBy || 'Class Teacher'} {cmp.repliedAt ? `• ${new Date(cmp.repliedAt).toLocaleDateString()}` : ''}
                            </span>
                          </div>
                          <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">{cmp.teacherReply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Reply Modal */}
              {selectedComplaintForReply && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Reply className="w-4 h-4 text-rose-500" /> Reply to Parent Grievance
                      </h4>
                      <button onClick={() => setSelectedComplaintForReply(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Subject: {selectedComplaintForReply.subject}</p>
                      <p className="text-slate-500 text-[11px]">Parent: {selectedComplaintForReply.parentName} ({selectedComplaintForReply.phone})</p>
                      <p className="text-slate-700 dark:text-slate-300 text-xs italic">"{selectedComplaintForReply.description}"</p>
                    </div>

                    <form onSubmit={handleReplyComplaint} className="space-y-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Teacher's Official Solution & Response to Parent
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Write clear explanation or resolution taken by the school..."
                          value={complaintReplyText}
                          onChange={e => setComplaintReplyText(e.target.value)}
                          className="w-full p-3 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-normal"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedComplaintForReply(null)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-extrabold shadow"
                        >
                          Send Official Reply & Mark Resolved
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Log New Grievance Modal */}
              {showNewComplaintModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs font-medium">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MessageSquareWarning className="w-4 h-4 text-rose-500" /> Log Parent Grievance / Complaint
                      </h4>
                      <button onClick={() => setShowNewComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateComplaint} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Parent Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Sah"
                            value={newComplaintForm.parentName}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, parentName: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Parent Phone</label>
                          <input
                            type="tel"
                            placeholder="+91 98350..."
                            value={newComplaintForm.phone}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, phone: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Student Name</label>
                          <input
                            type="text"
                            placeholder="Student name"
                            value={newComplaintForm.studentName}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, studentName: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Student Roll No</label>
                          <input
                            type="text"
                            placeholder="e.g. 05"
                            value={newComplaintForm.studentRollNo}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, studentRollNo: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category</label>
                          <select
                            value={newComplaintForm.category}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, category: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                          >
                            <option value="Teaching & Academics">Teaching & Academics</option>
                            <option value="Transport & Bus">Transport & Bus</option>
                            <option value="Discipline & Behavior">Discipline & Behavior</option>
                            <option value="Campus Cleanliness & Facilities">Campus Cleanliness & Facilities</option>
                            <option value="Fees & Accounts">Fees & Accounts</option>
                            <option value="General Complaint">General Complaint</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Priority</label>
                          <select
                            value={newComplaintForm.priority}
                            onChange={e => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value as any })}
                            className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                          >
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Subject / Summary</label>
                        <input
                          type="text"
                          required
                          placeholder="Brief topic of complaint"
                          value={newComplaintForm.subject}
                          onChange={e => setNewComplaintForm({ ...newComplaintForm, subject: e.target.value })}
                          className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Full Description</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Detailed notes from parent..."
                          value={newComplaintForm.description}
                          onChange={e => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                          className="w-full p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowNewComplaintModal(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl font-extrabold shadow"
                        >
                          Register Grievance
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tool 12: Digital ID Card */}
        {activeTab === 'idcard' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> Student Digital ID Pass Generator
            </h3>

            <div className="flex gap-2">
              <label className="font-bold text-xs self-center">Select Student:</label>
              <select
                value={selectedStudentForCard?.id || ''}
                onChange={e => {
                  const s = students.find(x => x.id === e.target.value);
                  if (s) setSelectedStudentForCard(s);
                }}
                className="p-2 border rounded-xl text-xs bg-stone-50 dark:bg-slate-800 font-bold"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.rollNo}. {st.name}</option>
                ))}
              </select>
            </div>

            {selectedStudentForCard && (
              <div className="flex justify-center p-6 bg-slate-100 dark:bg-slate-950 rounded-3xl border">
                <StudentIDCard student={selectedStudentForCard} settings={settings} />
              </div>
            )}
          </div>
        )}

        {/* Tool 13: Progress Trends */}
        {activeTab === 'trends' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> Class Academic Performance Analytics
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEFAULT_SUBJECTS}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="marksObtained" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Subject Avg Marks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tool 14: School Transport */}
        {activeTab === 'transport' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-orange-500" /> School Transport & Bus Routes
            </h3>

            <form onSubmit={handleCreateTransportRoute} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Add New Bus Route & Tier</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Route Name / Stops (e.g. Sikta - Main Market)"
                  value={newTransportForm.routeName}
                  onChange={e => setNewTransportForm({ ...newTransportForm, routeName: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  required
                  placeholder="Bus No (e.g. BR22-P-1002)"
                  value={newTransportForm.vehicleNo}
                  onChange={e => setNewTransportForm({ ...newTransportForm, vehicleNo: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Driver Name & Phone"
                  value={newTransportForm.driverName}
                  onChange={e => setNewTransportForm({ ...newTransportForm, driverName: e.target.value })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                />
                <input
                  type="number"
                  placeholder="Monthly Fee (₹)"
                  value={newTransportForm.fareMonthly}
                  onChange={e => setNewTransportForm({ ...newTransportForm, fareMonthly: Number(e.target.value) })}
                  className="p-2.5 rounded-xl border bg-white dark:bg-slate-900 font-bold"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">
                Add Transport Route
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {transportList.map(tr => (
                <div key={tr.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tr.routeName}</h4>
                      <p className="text-orange-600 font-bold">Bus: {tr.vehicleNo}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingTransport(tr)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Edit Route"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteTransportRoute(tr.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete Route"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-slate-500">Driver: {tr.driverName || 'Assigned'} {tr.driverPhone ? `(${tr.driverPhone})` : ''}</p>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-600 font-extrabold rounded-md">Monthly Fare: ₹{tr.fareMonthly || 1000}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-300">Standard Class Bus Tiers</h4>
              <p>Tier 1 (0-3 KM): ₹750/mo | Tier 2 (3-6 KM): ₹900/mo | Tier 3 (6-10 KM): ₹1000/mo | Tier 4 (10-15 KM): ₹1200/mo | Tier 5 (15+ KM): ₹1500/mo</p>
            </div>
          </div>
        )}

        {/* Tool 15: Admit Card */}
        {activeTab === 'admit-card' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-rose-500" /> Term Examination Admit Cards
            </h3>

            <div className="p-5 bg-stone-50 dark:bg-slate-800 rounded-2xl border text-xs space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white">Active Examination Pass</h4>
              <p>Term Examinations 2026 - All enrolled students in Class {selectedClass}-{selectedSection} have active generated Admit Cards.</p>
            </div>
          </div>
        )}

        {/* Tool 16: Fee Receipts */}
        {activeTab === 'fee' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-teal-600" /> Class Fee Dues & Billing History
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {students.map(st => (
                <div key={st.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{st.name}</h4>
                    <p className="text-amber-600 font-bold">Pending: ₹{st.feeInfo?.pending || 0}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStudentForReceipt(st)}
                    className="px-3 py-1.5 bg-teal-600 text-white font-bold rounded-xl"
                  >
                    View Receipt
                  </button>
                </div>
              ))}
            </div>

            {selectedStudentForReceipt && (
              <div className="p-6 bg-slate-100 dark:bg-slate-950 rounded-3xl border">
                <OfficialFeeReceipt
                  student={selectedStudentForReceipt}
                  receiptNo={`REC-${Date.now().toString().slice(-5)}`}
                  paymentDate={new Date().toISOString().split('T')[0]}
                  paymentMode="Cash"
                  collectedItems={[{ headName: 'Monthly Tuition Fee', monthName: 'Current Month', amount: 1500 }]}
                  totalPaid={1500}
                  settings={settings}
                />
              </div>
            )}
          </div>
        )}

        {/* Tool 17: Declarations */}
        {activeTab === 'declarations' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" /> Student Declarations & Safety Guidelines
            </h3>

            <div className="p-5 bg-stone-50 dark:bg-slate-800 rounded-2xl border text-xs space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Active Safety Declaration 2026</h4>
              <p className="text-slate-600 dark:text-slate-300">1. Attendance above 75% is required for term exams.<br />2. Mobile phones are forbidden during school hours.<br />3. Parents must acknowledge diary notes daily.</p>
            </div>
          </div>
        )}

      </div>

      {/* Password Reset Modal */}
      {passResetStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-medium shadow-2xl">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" /> Set Student Password ({passResetStudent.name})
            </h4>
            {passResetMsg && <p className="text-emerald-500 font-bold">{passResetMsg}</p>}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">New Account Password</label>
              <input
                type="text"
                value={passResetVal}
                onChange={e => setPassResetVal(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPassResetStudent(null)} className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold">Cancel</button>
              <button onClick={handleQuickSetPassword} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-black shadow">Update Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Edit Modal */}
      {showStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 space-y-5 text-xs font-medium shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2 font-heading">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  {editingStudent.name ? `Edit Student: ${editingStudent.name}` : 'Register New Student Profile'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update student identity, photo, and view facility enrollments for Class {editingStudent.class || selectedClass}-{editingStudent.section || selectedSection}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStudentModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentProfile} className="space-y-4">
              {/* Photo Upload & Preview Section */}
              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" /> Student Profile Photo
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative group shrink-0">
                    {editingStudent.photo ? (
                      <img
                        src={editingStudent.photo}
                        alt="Student preview"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-400/60 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 gap-1">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-bold">No Photo</span>
                      </div>
                    )}
                    {editingStudent.photo && (
                      <button
                        type="button"
                        onClick={() => setEditingStudent({ ...editingStudent, photo: '' })}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full text-[10px] shadow hover:bg-rose-600 cursor-pointer"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Photo Action Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Phone / PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Please select an image smaller than 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingStudent({ ...editingStudent, photo: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* Avatar Quick Presets */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Presets:</span>
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
                        ].map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditingStudent({ ...editingStudent, photo: url })}
                            className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <img src={url} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="url"
                      value={editingStudent.photo || ''}
                      onChange={e => setEditingStudent({ ...editingStudent, photo: e.target.value })}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Student Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.rollNo}
                    onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                    placeholder="e.g. 101"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Assigned Class *</label>
                  <select
                    value={editingStudent.class}
                    onChange={e => setEditingStudent({ ...editingStudent, class: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                      <option key={c} value={c}>
                        {['Playgroup', 'Nursery', 'LKG', 'UKG'].includes(c) ? c : `Class ${c}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Assigned Section *</label>
                  <select
                    value={editingStudent.section}
                    onChange={e => setEditingStudent({ ...editingStudent, section: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {['A', 'B', 'C', 'D'].map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Father / Parent Name *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.parentName}
                    onChange={e => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Mother Name</label>
                  <input
                    type="text"
                    value={editingStudent.motherName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, motherName: e.target.value })}
                    placeholder="e.g. Sunita Devi"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Parent Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.phone}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    placeholder="+91 98350 12345"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={editingStudent.dob || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gender</label>
                  <select
                    value={editingStudent.gender || 'Male'}
                    onChange={e => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Enrollment / Reg Number</label>
                  <input
                    type="text"
                    value={editingStudent.enrollmentNo || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, enrollmentNo: e.target.value })}
                    placeholder="MPS-2026-001"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={editingStudent.admissionDate}
                    onChange={e => setEditingStudent({ ...editingStudent, admissionDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Portal Password</label>
                  <input
                    type="text"
                    value={editingStudent.password || '123'}
                    onChange={e => setEditingStudent({ ...editingStudent, password: e.target.value })}
                    placeholder="Login Password"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={e => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  placeholder="Village/Town, Block Sikta, West Champaran, Bihar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* HOSTEL & TRANSPORTATION FACILITIES (VIEW ONLY / READ ONLY FOR TEACHERS) */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Hostel & Transportation Facilities (Admin Managed — View Only)
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    Read-Only for Teachers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Hostel Facility Status */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Hostel Accommodation</span>
                    </div>
                    {editingStudent.hostelEnrolled ? (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[11px] rounded-lg border border-indigo-500/20">
                          🏠 Enrolled
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 font-bold font-mono">
                          ₹{(editingStudent.hostelFee || 5000).toLocaleString()}/mo
                        </span>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px] pt-1">Not Enrolled (Day Scholar)</p>
                    )}
                  </div>

                  {/* Transportation Facility Status */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">School Bus / Transport</span>
                    </div>
                    {editingStudent.transportEnrolled ? (
                      <div className="space-y-0.5 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black text-[11px] rounded-lg border border-amber-500/20">
                            🚌 Active Route
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 font-bold font-mono">
                            ₹{(editingStudent.transportFee || 1000).toLocaleString()}/mo
                          </span>
                        </div>
                        {editingStudent.transportRoute && (
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            Route: {editingStudent.transportRoute}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px] pt-1">Self Transport / Private</p>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Note: Hostel and transport fee structures & enrollment are configured by the Principal / Admin accounts desk and are read-only for teachers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tool Edit Modals */}
      {editingHomework && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Homework Task</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateHomework(editingHomework.id, editingHomework);
              setEditingHomework(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Subject</label>
                <input type="text" value={editingHomework.subject} onChange={e => setEditingHomework({ ...editingHomework, subject: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Task Title</label>
                <input type="text" value={editingHomework.title} onChange={e => setEditingHomework({ ...editingHomework, title: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Due Date</label>
                <input type="date" value={editingHomework.dueDate} onChange={e => setEditingHomework({ ...editingHomework, dueDate: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea rows={3} value={editingHomework.description} onChange={e => setEditingHomework({ ...editingHomework, description: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingHomework(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingDiaryEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit School Diary Note</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateSchoolDiary(editingDiaryEntry.id, editingDiaryEntry);
              setEditingDiaryEntry(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Subject</label>
                <input type="text" value={editingDiaryEntry.subject} onChange={e => setEditingDiaryEntry({ ...editingDiaryEntry, subject: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Title</label>
                <input type="text" value={editingDiaryEntry.title} onChange={e => setEditingDiaryEntry({ ...editingDiaryEntry, title: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Content / Instruction</label>
                <textarea rows={3} value={editingDiaryEntry.content || editingDiaryEntry.note || ''} onChange={e => setEditingDiaryEntry({ ...editingDiaryEntry, content: e.target.value, note: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingDiaryEntry(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStudyMaterial && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Study Material</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateStudyMaterial(editingStudyMaterial.id, editingStudyMaterial);
              setEditingStudyMaterial(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Subject</label>
                <input type="text" value={editingStudyMaterial.subject} onChange={e => setEditingStudyMaterial({ ...editingStudyMaterial, subject: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Title</label>
                <input type="text" value={editingStudyMaterial.title} onChange={e => setEditingStudyMaterial({ ...editingStudyMaterial, title: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">PDF URL / Drive Link</label>
                <input type="text" value={editingStudyMaterial.fileUrl} onChange={e => setEditingStudyMaterial({ ...editingStudyMaterial, fileUrl: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingStudyMaterial(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOnlineClass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Zoom Online Class</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateOnlineClass(editingOnlineClass.id, editingOnlineClass);
              setEditingOnlineClass(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Class Title</label>
                <input type="text" value={editingOnlineClass.title} onChange={e => setEditingOnlineClass({ ...editingOnlineClass, title: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Zoom URL</label>
                <input type="text" value={editingOnlineClass.zoomUrl} onChange={e => setEditingOnlineClass({ ...editingOnlineClass, zoomUrl: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Meeting ID</label>
                <input type="text" value={editingOnlineClass.meetingId} onChange={e => setEditingOnlineClass({ ...editingOnlineClass, meetingId: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Passcode</label>
                <input type="text" value={editingOnlineClass.passcode} onChange={e => setEditingOnlineClass({ ...editingOnlineClass, passcode: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingOnlineClass(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingOnlineExam && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Online Exam</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateOnlineExam(editingOnlineExam.id, editingOnlineExam);
              setEditingOnlineExam(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Exam Title</label>
                <input type="text" value={editingOnlineExam.title} onChange={e => setEditingOnlineExam({ ...editingOnlineExam, title: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Exam Date</label>
                <input type="date" value={editingOnlineExam.date} onChange={e => setEditingOnlineExam({ ...editingOnlineExam, date: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Total Marks</label>
                <input type="number" value={editingOnlineExam.totalMarks} onChange={e => setEditingOnlineExam({ ...editingOnlineExam, totalMarks: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingOnlineExam(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTimeTableSlot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Timetable Slot</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateTimeTableSlot(editingTimeTableSlot.id, editingTimeTableSlot);
              setEditingTimeTableSlot(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Subject</label>
                <input type="text" value={editingTimeTableSlot.subject} onChange={e => setEditingTimeTableSlot({ ...editingTimeTableSlot, subject: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Time Range</label>
                <input type="text" value={editingTimeTableSlot.startTime} onChange={e => setEditingTimeTableSlot({ ...editingTimeTableSlot, startTime: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingTimeTableSlot(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSyllabusItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Syllabus Chapter</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateSyllabus(editingSyllabusItem.id, editingSyllabusItem);
              setEditingSyllabusItem(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Chapter Name</label>
                <input type="text" value={editingSyllabusItem.chapterName || editingSyllabusItem.chapters || ''} onChange={e => setEditingSyllabusItem({ ...editingSyllabusItem, chapterName: e.target.value, chapters: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Status</label>
                <select value={editingSyllabusItem.status} onChange={e => setEditingSyllabusItem({ ...editingSyllabusItem, status: e.target.value as any })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800 font-bold">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSyllabusItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMessage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit / Reply Message</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateSchoolMessage(editingMessage.id, editingMessage);
              setEditingMessage(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Message Title</label>
                <input type="text" value={editingMessage.title || editingMessage.subject || ''} onChange={e => setEditingMessage({ ...editingMessage, title: e.target.value, subject: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Message Content</label>
                <textarea rows={3} value={editingMessage.content || editingMessage.message || ''} onChange={e => setEditingMessage({ ...editingMessage, content: e.target.value, message: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Teacher Reply (Optional)</label>
                <textarea rows={2} value={editingMessage.reply || ''} onChange={e => setEditingMessage({ ...editingMessage, reply: e.target.value, status: 'Replied' })} placeholder="Type teacher reply to student message..." className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800 text-emerald-600 font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingMessage(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTransport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-2xl max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Edit Bus Route</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await api.updateTransport(editingTransport.id, editingTransport);
              setEditingTransport(null);
              loadClassData(selectedClass, selectedSection);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Route Name</label>
                <input type="text" value={editingTransport.routeName} onChange={e => setEditingTransport({ ...editingTransport, routeName: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Bus Vehicle No</label>
                <input type="text" value={editingTransport.vehicleNo} onChange={e => setEditingTransport({ ...editingTransport, vehicleNo: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Driver Name & Phone</label>
                <input type="text" value={editingTransport.driverName} onChange={e => setEditingTransport({ ...editingTransport, driverName: e.target.value })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block font-bold mb-1">Monthly Fare (₹)</label>
                <input type="number" value={editingTransport.fareMonthly} onChange={e => setEditingTransport({ ...editingTransport, fareMonthly: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border bg-stone-50 dark:bg-slate-800 font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingTransport(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ATTENDANCE SUCCESSFULLY PUBLISHED SUCCESS POPUP MODAL */}
      {attendancePublishModal && attendancePublishModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/60 shadow-2xl max-w-lg w-full space-y-6 relative overflow-hidden ring-4 ring-emerald-500/20">
            {/* Background glowing flair */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shrink-0 shadow-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span>Official Record Live</span> • <span>Synced</span>
                </div>
                <h3 className="text-xl font-black font-heading text-slate-900 dark:text-white">
                  Attendance Successfully Published!
                </h3>
                <p className="text-xs text-slate-500">
                  Daily register for <strong className="text-slate-800 dark:text-slate-200">Class {attendancePublishModal.className}-{attendancePublishModal.section}</strong> on <strong className="text-slate-800 dark:text-slate-200">{attendancePublishModal.date}</strong> has been officially published.
                </p>
              </div>
            </div>

            {/* Attendance Breakdown Grid */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Enrolled Students:</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{attendancePublishModal.totalStudents}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-heading">
                    {attendancePublishModal.presentCount}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Present</span>
                </div>

                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800/60">
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-heading">
                    {attendancePublishModal.absentCount}
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase">Absent</span>
                </div>

                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-heading">
                    {attendancePublishModal.lateCount}
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">Late</span>
                </div>

                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-heading">
                    {attendancePublishModal.leaveCount}
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Leave</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                <span>Class Attendance Rate:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{attendancePublishModal.attendanceRate}%</span>
              </div>
            </div>

            {/* Portal Sync & Confirmation Notice */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Records are now visible across Student & Parent dashboards in real-time.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAttendancePublishModal(null)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer select-none text-center"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWorkspace;
