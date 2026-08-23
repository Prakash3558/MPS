import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../lib/api';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { downloadElementAsPDF } from '../../lib/pdf';
import {
  Teacher, Student, AttendanceRecord, ExamResult, Homework, OnlineClass, OnlineExam,
  TimeTableSlot, StudyMaterial, SchoolDiaryEntry, SyllabusItem, TransportRoute, AdmitCard,
  StudentDeclaration, SchoolMessage, RecordUpdateReq
} from '../../types';
import { StudentIDCard } from '../common/StudentIDCard';
import { OfficialFeeReceipt } from '../common/OfficialFeeReceipt';
import { AIHomeworkTutor } from '../common/AIHomeworkTutor';
import { CaptchaWidget } from '../common/CaptchaWidget';
import {
  UserCheck, LogOut, Users, Calendar, Award, BookOpen, Plus, Trash2, Edit3, Save, Upload, Check,
  AlertTriangle, Key, Search, FileText, BarChart2, TrendingUp, CheckCircle2, XCircle, Clock,
  AlertCircle, RefreshCw, DollarSign, PieChart, CreditCard, Video, FileQuestion, ExternalLink,
  Link2, Home, Notebook, BookMarked, Bus, FileCheck, MessageSquare, ShieldCheck, Bot, Sparkles,
  Send, IndianRupee, CheckCircle, Truck, Building2, Printer, Download, Filter,
  Bell, BellRing, Zap, X, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

export const TeacherWorkspace: React.FC = () => {
  const { teacher, loginUser, logout } = useAuth();
  const { settings } = useCMS();

  // Teacher Login State
  const [loginForm, setLoginForm] = useState({ username: '', phone: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  // Active Class & Section filter
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');

  // Teacher Data Lists
  const [students, setStudents] = useState<Student[]>([]);

  // 18 Tool Types
  type TabType =
    | 'homework'
    | 'attendance'
    | 'diary'
    | 'study-material'
    | 'online-classes'
    | 'online-exams'
    | 'timetable'
    | 'messages'
    | 'syllabus'
    | 'marks'
    | 'students'
    | 'idcard'
    | 'trends'
    | 'transport'
    | 'admit-card'
    | 'fee'
    | 'declarations'
    | 'ai-tutor';

  // Default selected tool is HOMEWORK as requested!
  const [activeTab, setActiveTab] = useState<TabType>('homework');

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
  const [summaryMonth, setSummaryMonth] = useState<string>('2026-08'); // YYYY-MM
  const [allClassAttendance, setAllClassAttendance] = useState<AttendanceRecord[]>([]);

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

  // Marks Form States
  const [selectedExamStudent, setSelectedExamStudent] = useState<Student | null>(null);
  const [examType, setExamType] = useState('Mid-Term Examination');
  const [customExamType, setCustomExamType] = useState('');
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [subjectsList, setSubjectsList] = useState(DEFAULT_SUBJECTS);
  const [teacherRemarks, setTeacherRemarks] = useState('Good academic progress.');

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
      const [stList, hwList, attList, allAtt, ocList, oeList, ttList, smList, sdList, sylList, msgList, trList] = await Promise.all([
        api.getStudents(cls, sec).catch(() => []),
        api.getHomework(cls, sec).catch(() => []),
        api.getAttendance(undefined, cls, sec, attendanceDate).catch(() => []),
        api.getAttendance(undefined, cls, sec, undefined).catch(() => []),
        api.getOnlineClasses(cls, sec).catch(() => []),
        api.getOnlineExams(cls, sec).catch(() => []),
        api.getTimeTable(cls, sec).catch(() => []),
        api.getStudyMaterial(cls).catch(() => []),
        api.getSchoolDiary(cls, sec).catch(() => []),
        api.getSyllabus(cls).catch(() => []),
        api.getSchoolMessages().catch(() => []),
        api.getTransport().catch(() => [])
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
    setLoginLoading(true);
    try {
      const res = await api.login({
        role: 'teacher',
        username: loginForm.username.trim(),
        password: loginForm.password.trim(),
        captchaToken: captchaToken || undefined
      });
      if (res.success && res.teacher) {
        loginUser({ user: res.user, teacher: res.teacher });
      } else {
        setLoginError(res.message || 'Invalid teacher username or password.');
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
      if (editingStudent.id && (editingStudent.id.startsWith('s-') || !editingStudent.id.startsWith('temp-'))) {
        await api.updateStudent(editingStudent.id, editingStudent);
      } else {
        await api.createStudent({
          ...editingStudent,
          id: 's-' + Date.now()
        });
      }
      setShowStudentModal(false);
      setEditingStudent(null);
      loadClassData(selectedClass, selectedSection);
      alert(`Student profile for "${editingStudent.name}" saved successfully!`);
    } catch (e) {
      console.error('Failed to save student profile:', e);
      alert('Failed to save student profile. Please try again.');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student profile for "${name}"? This action cannot be undone.`)) {
      try {
        await api.deleteStudent(id);
        loadClassData(selectedClass, selectedSection);
      } catch (e) {
        console.error('Failed to delete student:', e);
        alert('Failed to delete student profile.');
      }
    }
  };

  const isSunday = new Date(attendanceDate + 'T00:00:00').getDay() === 0;

  const handleSaveAttendance = async (publish: boolean = false) => {
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
      alert(publish ? `Daily attendance for ${attendanceDate} published successfully!` : `Attendance draft saved!`);
      loadClassData(selectedClass, selectedSection);
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
      alert(`✓ Daily Attendance for Today (${todayDateStr}) published successfully! All ${students.length} students marked Present.`);
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
    setActiveTab('attendance');
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
    setSelectedExamStudent(null);
    alert(`Marks recorded for ${studentName} (${activeExamType})`);
    try {
      await api.saveExamResult({
        studentId: selectedExamStudent.id,
        examType: activeExamType,
        academicYear: '2025-2026',
        subjects: subjectsList,
        teacherRemarks
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 text-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 p-2 text-emerald-400 flex items-center justify-center mx-auto shadow-xl overflow-hidden ring-4 ring-emerald-500/20">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="MPS Logo" className="w-full h-full object-contain" />
              ) : (
                <UserCheck className="w-10 h-10 text-emerald-500" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white font-heading">
              Teacher Workspace Portal
            </h2>
            <p className="text-xs text-slate-400">Model Public School (MPS Sikta)</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-950/80 text-rose-300 text-xs rounded-xl border border-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Teacher Username</label>
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter teacher username"
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

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In To Teacher Workspace'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 18 Tools Definition array ordered logically: Daily use first!
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
    { id: 'diary', title: 'School Diary', subtitle: 'Teacher Notes', icon: Notebook, color: 'text-blue-500' },
    { id: 'study-material', title: 'Study Material', subtitle: 'PDFs & Notes', icon: FileText, color: 'text-purple-500' },
    { id: 'online-classes', title: 'Online Classes', subtitle: `${onlineClassesList.length} Live Zoom`, icon: Video, color: 'text-indigo-500' },
    { id: 'online-exams', title: 'Online Exams', subtitle: `${onlineExamsList.length} Scheduled`, icon: FileQuestion, color: 'text-rose-500' },
    { id: 'timetable', title: 'Time Table', subtitle: 'Daily Routine', icon: Clock, color: 'text-teal-500' },
    { id: 'messages', title: 'Messages', subtitle: 'Broadcast Alerts', icon: MessageSquare, color: 'text-sky-500' },
    { id: 'syllabus', title: 'Course Syllabus', subtitle: 'Curriculum', icon: BookMarked, color: 'text-emerald-600' },
    { id: 'marks', title: 'Marksheets', subtitle: 'Report Card', icon: Award, color: 'text-amber-600' },
    { id: 'students', title: 'Corrections', subtitle: `${students.length} Profiles`, icon: Users, color: 'text-indigo-600' },
    { id: 'idcard', title: 'Digital ID Card', subtitle: 'Identity', icon: CreditCard, color: 'text-emerald-500' },
    { id: 'trends', title: 'Progress Trends', subtitle: 'Analytics', icon: TrendingUp, color: 'text-amber-500' },
    { id: 'transport', title: 'School Transport', subtitle: 'Bus Route', icon: Bus, color: 'text-orange-500' },
    { id: 'admit-card', title: 'Admit Card', subtitle: 'Exam Pass', icon: FileCheck, color: 'text-rose-500' },
    { id: 'fee', title: 'Fee Receipts', subtitle: 'Billing History', icon: IndianRupee, color: 'text-teal-600' },
    { id: 'declarations', title: 'Declarations', subtitle: 'Rules & Safety', icon: ShieldCheck, color: 'text-purple-600' },
    { id: 'ai-tutor', title: 'AI Homework Tutor', subtitle: 'Instant Help', icon: Bot, color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-heading text-white">{teacher.name}</h1>
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                  Assigned: Class {selectedClass}-{selectedSection}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Subject Specialist: <strong>{teacher.subject}</strong> | Username: {teacher.username}
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Teacher Workspace Tools Grid
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">18 Editable Features</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {TOOLS_LIST.map(tool => {
              const IconComp = tool.icon;
              const isActive = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`p-3.5 rounded-2xl font-bold text-xs transition-all flex flex-col items-center justify-center text-center gap-1.5 border min-h-[92px] relative ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-lg ring-2 ring-amber-400 scale-[1.02]'
                      : 'bg-stone-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tool.alert && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                  <IconComp className={`w-6 h-6 ${isActive ? 'text-slate-950' : tool.color}`} />
                  <div>
                    <span className="block leading-tight">{tool.title}</span>
                    <span className={`text-[10px] font-normal block ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                      {tool.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
          const todayStr = '2026-08-21';

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
            '2026-08': 'August 2026',
            '2026-07': 'July 2026',
            '2026-06': 'June 2026',
            '2026-05': 'May 2026',
            '2026-04': 'April 2026'
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

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Selected Register Date:</span>
                        <p className="text-[11px] text-slate-500">Pick date to view or modify class attendance</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={e => setAttendanceDate(e.target.value)}
                          className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                        />
                        <button
                          onClick={() => handleSaveAttendance(false)}
                          className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-300 transition-all"
                        >
                          <Save className="w-4 h-4" /> Save Draft
                        </button>
                        <button
                          onClick={() => handleSaveAttendance(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
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
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs"
                      >
                        ✓ Mark All Present
                      </button>
                      <button
                        onClick={() => {
                          const newMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
                          students.forEach(s => newMap[s.id] = 'Absent');
                          setAttendanceMap(newMap);
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-xs"
                      >
                        ✕ Mark All Absent
                      </button>
                      <button
                        onClick={() => {
                          const newMap: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'> = {};
                          students.forEach(s => newMap[s.id] = 'Holiday');
                          setAttendanceMap(newMap);
                        }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1"
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
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                                  attendanceMap[st.id] === status
                                    ? status === 'Holiday'
                                      ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                                      : status === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : status === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : status === 'Late'
                                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                                      : 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                          <option value="2026-08">August 2026</option>
                          <option value="2026-07">July 2026</option>
                          <option value="2026-06">June 2026</option>
                          <option value="2026-05">May 2026</option>
                          <option value="2026-04">April 2026</option>
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

        {/* Tool 10: Marksheets */}
        {activeTab === 'marks' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" /> Gradebook & Marksheet Entry Manager
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map(st => (
                <div key={st.id} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{st.name}</h4>
                    <p className="text-slate-500">Roll No: {st.rollNo}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExamStudent(st);
                      setSubjectsList(DEFAULT_SUBJECTS);
                    }}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl font-bold"
                  >
                    Enter Marks
                  </button>
                </div>
              ))}
            </div>

            {selectedExamStudent && (
              <form onSubmit={handleSaveMarks} className="p-5 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs font-medium">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Enter Exam Result for {selectedExamStudent.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subjectsList.map((subj, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border">
                      <span className="font-bold text-slate-900 dark:text-white">{subj.subject}</span>
                      <input
                        type="number"
                        max={100}
                        value={subj.marksObtained}
                        onChange={e => {
                          const updated = [...subjectsList];
                          updated[idx].marksObtained = Number(e.target.value);
                          setSubjectsList(updated);
                        }}
                        className="w-20 p-1.5 border rounded-lg text-right font-bold"
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl">
                  Save Exam Result
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tool 11: Class Students & Profile Corrections */}
        {activeTab === 'students' && (() => {
          const filteredList = students.filter(s =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.parentName && s.parentName.toLowerCase().includes(studentSearch.toLowerCase())) ||
            (s.phone && s.phone.includes(studentSearch))
          );

          return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Class {selectedClass}-{selectedSection} Student Profiles & Management
                  </h3>
                  <p className="text-xs text-slate-500">Edit student details, credentials, parent contact numbers, and profile corrections</p>
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
                        feeInfo: { totalAnnual: 25100, paid: 0, pending: 25100, months: [] }
                      });
                      setShowStudentModal(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform hover:scale-[1.01]"
                  >
                    <Plus className="w-4 h-4" /> Add New Student
                  </button>
                </div>
              </div>

              {/* Student Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredList.map(st => (
                  <div
                    key={st.id}
                    className="p-5 bg-stone-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 relative hover:border-amber-400/80 transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                            {st.rollNo || '#'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{st.name}</h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Class {st.class}-{st.section} | ID: {st.userId || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] rounded-lg border border-indigo-500/20">
                          Active
                        </span>
                      </div>

                      <div className="text-xs space-y-1 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60">
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Father/Parent:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{st.parentName || 'Not Listed'}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Phone:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{st.phone || 'N/A'}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Address:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[160px]">{st.address || 'Sikta, West Champaran'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-medium">Pending Dues:</span>
                          <strong className="text-rose-600 dark:text-rose-400 font-extrabold">₹{st.feeInfo?.pending || 0}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setShowStudentModal(true);
                        }}
                        className="flex-1 py-1.5 px-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 rounded-xl flex items-center justify-center gap-1 font-extrabold transition-colors"
                        title="Edit Student Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          setPassResetStudent(st);
                          setPassResetVal(st.password || st.rollNo + '123');
                        }}
                        className="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-xl flex items-center gap-1 font-bold"
                        title="Reset Student Login Password"
                      >
                        <Key className="w-3.5 h-3.5" /> Pass
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStudentForCard(st);
                          setActiveTab('idcard');
                        }}
                        className="py-1.5 px-2.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 rounded-xl flex items-center gap-1 font-bold"
                        title="View Digital ID Pass"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> ID
                      </button>

                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-xl"
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

              {/* Correction Requests Sub-Section */}
              <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                <h4 className="font-extrabold text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Pending Student Profile Correction Requests
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300/80">
                  Review and verify student profile update requests submitted by parents or students.
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200/80 dark:border-indigo-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">Rahul Kumar (Roll #04)</span>
                      <p className="text-slate-500 text-[11px]">Requested Change: Parent Phone updated to +91 98350 11223</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert('Student profile correction approved and updated!')}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => alert('Correction request rejected.')}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[11px]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

        {/* Tool 18: AI Homework Tutor */}
        {activeTab === 'ai-tutor' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" /> Teacher AI Lesson & Homework Assistant
            </h3>
            <AIHomeworkTutor className={selectedClass} subject={teacher.subject} />
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 space-y-5 text-xs font-medium shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 font-heading">
                <Edit3 className="w-5 h-5 text-amber-500" />
                {editingStudent.name ? `Edit Profile: ${editingStudent.name}` : 'Register New Student Profile'}
              </h3>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setEditingStudent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentProfile} className="space-y-4">
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
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
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={editingStudent.admissionDate}
                    onChange={e => setEditingStudent({ ...editingStudent, admissionDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account Password</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs">
                <div>
                  <span className="block text-amber-900 dark:text-amber-300 font-bold mb-1">Annual Fee Structure (Read-Only)</span>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 font-extrabold text-slate-900 dark:text-white">
                    ₹{(editingStudent.feeInfo?.totalAnnual || 25100).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="block text-amber-900 dark:text-amber-300 font-bold mb-1">Pending Fee Dues (Read-Only)</span>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 font-extrabold text-rose-600">
                    ₹{(editingStudent.feeInfo?.pending || 0).toLocaleString()}
                  </div>
                </div>

                <p className="col-span-1 sm:col-span-2 text-[11px] text-amber-800 dark:text-amber-400 italic">
                  * Note: Fee structure and pending dues are managed exclusively by the Finance & Admin Accounts department.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                >
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
    </div>
  );
};
