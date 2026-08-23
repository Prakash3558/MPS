import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, GraduationCap, Users, FileText, ClipboardList, Megaphone,
  Video, FileQuestion, ArrowRight, Command, Phone, UserCheck, ShieldCheck,
  Check, Copy, Eye, Calendar, Sparkles, Filter, Tag, Hash, Building2
} from 'lucide-react';
import { Student, Teacher, AdmissionApplication, Notice, OnlineClass, OnlineExam } from '../../types';

export type AdminTabType =
  | 'site_content'
  | 'teachers'
  | 'students'
  | 'fees'
  | 'online_classes'
  | 'online_exams'
  | 'notices'
  | 'admissions'
  | 'gallery'
  | 'account';

interface AdminGlobalSearchProps {
  students: Student[];
  teachers: Teacher[];
  admissions: AdmissionApplication[];
  notices: Notice[];
  onlineClasses: OnlineClass[];
  onlineExams: OnlineExam[];
  onNavigateTab: (tab: AdminTabType, filterText?: string) => void;
}

type SearchCategory = 'all' | 'students' | 'teachers' | 'documents';

interface SearchResultItem {
  type: 'student' | 'teacher' | 'admission' | 'notice' | 'online_class' | 'online_exam';
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  details: { label: string; value: string }[];
  rawObject: any;
  targetTab: AdminTabType;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  students,
  teachers,
  admissions,
  notices,
  onlineClasses,
  onlineExams,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [searchBy, setSearchBy] = useState<'all' | 'name' | 'class' | 'rollNo'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inspectItem, setInspectItem] = useState<SearchResultItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard hotkey Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (inspectItem) {
          setInspectItem(null);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectItem]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query, category, searchBy, or classFilter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category, searchBy, classFilter]);

  // Build unified search results
  const q = query.trim().toLowerCase();

  const results: SearchResultItem[] = [];

  if (q.length > 0 || classFilter !== 'all') {
    // 1. Search Students
    if (category === 'all' || category === 'students') {
      students.forEach(s => {
        // First check class filter
        if (classFilter !== 'all' && s.class.toLowerCase() !== classFilter.toLowerCase()) {
          return;
        }

        let isMatch = false;
        if (!q) {
          // If query empty but classFilter set, show all in class
          isMatch = true;
        } else if (searchBy === 'name') {
          isMatch = s.name.toLowerCase().includes(q);
        } else if (searchBy === 'rollNo') {
          isMatch = s.rollNo.toLowerCase().includes(q);
        } else if (searchBy === 'class') {
          isMatch = s.class.toLowerCase().includes(q) || `class ${s.class}`.toLowerCase().includes(q);
        } else {
          // 'all'
          const nameMatch = s.name.toLowerCase().includes(q);
          const rollMatch = s.rollNo.toLowerCase().includes(q);
          const classMatch = s.class.toLowerCase().includes(q) || `class ${s.class}`.toLowerCase().includes(q);
          const idMatch = s.id.toLowerCase().includes(q) || (s.userId && s.userId.toLowerCase().includes(q));
          const parentMatch = s.parentName.toLowerCase().includes(q);
          const phoneMatch = s.phone.toLowerCase().includes(q);
          isMatch = nameMatch || rollMatch || classMatch || idMatch || parentMatch || phoneMatch;
        }

        if (isMatch) {
          results.push({
            type: 'student',
            id: s.id,
            title: s.name,
            subtitle: `Class ${s.class}-${s.section} | Roll No: ${s.rollNo}`,
            badge: `Class ${s.class}`,
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            details: [
              { label: 'Roll Number', value: s.rollNo },
              { label: 'Class & Sec', value: `${s.class} - ${s.section}` },
              { label: 'Student ID', value: s.id },
              { label: 'Parent / Guardian', value: s.parentName },
              { label: 'Contact Phone', value: s.phone },
              { label: 'Fee Status', value: s.feeInfo?.pending > 0 ? `Pending ₹${s.feeInfo.pending}` : 'All Clear (Paid)' }
            ],
            rawObject: s,
            targetTab: 'students'
          });
        }
      });
    }

    // 2. Search Faculty / Teachers
    if (category === 'all' || category === 'teachers') {
      teachers.forEach(t => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const subjectMatch = t.subject.toLowerCase().includes(q);
        const classMatch = t.assignedClass.toLowerCase().includes(q) || `class ${t.assignedClass}`.toLowerCase().includes(q);
        const idMatch = t.id.toLowerCase().includes(q) || (t.userId && t.userId.toLowerCase().includes(q));
        const usernameMatch = t.username.toLowerCase().includes(q);
        const phoneMatch = t.phone.toLowerCase().includes(q);

        if (nameMatch || subjectMatch || classMatch || idMatch || usernameMatch || phoneMatch) {
          results.push({
            type: 'teacher',
            id: t.id,
            title: t.name,
            subtitle: `Subject: ${t.subject} | Class: ${t.assignedClass}-${t.assignedSection}`,
            badge: 'Faculty',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            details: [
              { label: 'Faculty Name', value: t.name },
              { label: 'Subject Taught', value: t.subject },
              { label: 'Assigned Class', value: `${t.assignedClass} - ${t.assignedSection}` },
              { label: 'Faculty ID', value: t.id },
              { label: 'Portal Username', value: t.username },
              { label: 'Phone Contact', value: t.phone }
            ],
            rawObject: t,
            targetTab: 'teachers'
          });
        }
      });
    }

    // 3. Search Documents & Records (Admissions, Notices, Online Classes/Exams)
    if (category === 'all' || category === 'documents') {
      // Admissions
      admissions.forEach(a => {
        const nameMatch = a.studentName.toLowerCase().includes(q);
        const idMatch = a.id.toLowerCase().includes(q);
        const classMatch = a.targetClass.toLowerCase().includes(q);
        const parentMatch = a.parentName.toLowerCase().includes(q);
        const phoneMatch = a.phone.toLowerCase().includes(q);
        const statusMatch = a.status.toLowerCase().includes(q);

        if (nameMatch || idMatch || classMatch || parentMatch || phoneMatch || statusMatch) {
          results.push({
            type: 'admission',
            id: a.id,
            title: `Admission Application: ${a.studentName}`,
            subtitle: `Target Class: ${a.targetClass} | Parent: ${a.parentName} | Status: ${a.status}`,
            badge: `Doc: ${a.status}`,
            badgeColor: a.status === 'Pending' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            details: [
              { label: 'Applicant Name', value: a.studentName },
              { label: 'Application ID', value: a.id },
              { label: 'Target Class', value: a.targetClass },
              { label: 'Parent Name', value: a.parentName },
              { label: 'Contact Phone', value: a.phone },
              { label: 'Application Status', value: a.status },
              { label: 'Submission Date', value: a.appliedDate }
            ],
            rawObject: a,
            targetTab: 'admissions'
          });
        }
      });

      // Notices
      notices.forEach(n => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const contentMatch = n.content.toLowerCase().includes(q);
        const categoryMatch = n.category.toLowerCase().includes(q);
        const classMatch = (n.targetClass || '').toLowerCase().includes(q);
        const idMatch = n.id.toLowerCase().includes(q);

        if (titleMatch || contentMatch || categoryMatch || classMatch || idMatch) {
          results.push({
            type: 'notice',
            id: n.id,
            title: `Notice Circular: ${n.title}`,
            subtitle: `Category: ${n.category} | Class: ${n.targetClass || 'All'} | Date: ${n.date}`,
            badge: `Notice: ${n.category}`,
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            details: [
              { label: 'Notice Title', value: n.title },
              { label: 'Notice ID', value: n.id },
              { label: 'Category', value: n.category },
              { label: 'Target Audience', value: n.targetClass || 'All Classes' },
              { label: 'Publish Date', value: n.date },
              { label: 'Urgent Ticker', value: n.isUrgentTicker ? 'Yes' : 'No' }
            ],
            rawObject: n,
            targetTab: 'notices'
          });
        }
      });

      // Online Classes
      onlineClasses.forEach(c => {
        const titleMatch = c.title.toLowerCase().includes(q);
        const subjectMatch = c.subject.toLowerCase().includes(q);
        const teacherMatch = c.teacherName.toLowerCase().includes(q);
        const classMatch = c.class.toLowerCase().includes(q);
        const idMatch = c.id.toLowerCase().includes(q);

        if (titleMatch || subjectMatch || teacherMatch || classMatch || idMatch) {
          results.push({
            type: 'online_class',
            id: c.id,
            title: `Class Document: ${c.title}`,
            subtitle: `Subject: ${c.subject} | Class ${c.class}-${c.section} | Host: ${c.teacherName}`,
            badge: 'Online Class',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            details: [
              { label: 'Session Title', value: c.title },
              { label: 'Subject', value: c.subject },
              { label: 'Class & Sec', value: `${c.class} - ${c.section}` },
              { label: 'Teacher Host', value: c.teacherName },
              { label: 'Meeting ID', value: c.meetingId || c.id },
              { label: 'Status', value: c.status }
            ],
            rawObject: c,
            targetTab: 'online_classes'
          });
        }
      });

      // Online Exams
      onlineExams.forEach(e => {
        const titleMatch = e.title.toLowerCase().includes(q);
        const subjectMatch = e.subject.toLowerCase().includes(q);
        const classMatch = e.class.toLowerCase().includes(q);
        const idMatch = e.id.toLowerCase().includes(q);

        if (titleMatch || subjectMatch || classMatch || idMatch) {
          results.push({
            type: 'online_exam',
            id: e.id,
            title: `Exam Paper Document: ${e.title}`,
            subtitle: `Subject: ${e.subject} | Class ${e.class}-${e.section} | Date: ${e.date}`,
            badge: 'Exam Document',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            details: [
              { label: 'Exam Paper Title', value: e.title },
              { label: 'Subject', value: e.subject },
              { label: 'Class & Sec', value: `${e.class} - ${e.section}` },
              { label: 'Total Marks', value: `${e.totalMarks} Marks` },
              { label: 'Duration', value: `${e.durationMinutes} Minutes` },
              { label: 'Scheduled Date', value: e.date }
            ],
            rawObject: e,
            targetTab: 'online_exams'
          });
        }
      });
    }
  }

  // Handle arrow key navigation in results
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setInspectItem(item);
  };

  const handleJumpToTab = (item: SearchResultItem) => {
    setInspectItem(null);
    setIsOpen(false);
    let searchFilter = item.title;
    if (item.type === 'student') searchFilter = item.rawObject.rollNo || item.title;
    if (item.type === 'teacher') searchFilter = item.rawObject.name;
    onNavigateTab(item.targetTab, searchFilter);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative">
      {/* Search Input Trigger in Top Header */}
      <div className="relative flex items-center">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-slate-300 hover:text-white transition-all shadow-inner text-xs group"
        >
          <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium">
            Search students, faculty, roll no, ID, documents...
          </span>
          <span className="sm:hidden font-medium">Global Search...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700 rounded-lg ml-2">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Full Modal Search Dialog Overlay when open */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md transition-all">
          <div
            ref={dropdownRef}
            className="w-full max-w-2xl bg-[#0b182e] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Top Search Input Header & Filter Controls */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-900/80">
              <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl px-3 py-2 flex-1">
                <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDownInput}
                  placeholder={
                    searchBy === 'name' ? "Type student or teacher name..." :
                    searchBy === 'rollNo' ? "Type roll number (e.g. 1001)..." :
                    searchBy === 'class' ? "Type class (e.g. 10, 9)..." :
                    "Type name, roll no, class, faculty subject, document ID..."
                  }
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm font-semibold focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Select Options Bar: Class, Roll No, Name */}
              <div className="flex items-center gap-2">
                <select
                  value={searchBy}
                  onChange={e => setSearchBy(e.target.value as any)}
                  className="bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="all">🔍 Search: All Fields</option>
                  <option value="name">👤 Search: Name Bar</option>
                  <option value="class">🏫 Search: Class</option>
                  <option value="rollNo">🔢 Search: Roll No.</option>
                </select>

                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="all">All Classes</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all"
                >
                  ESC
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" /> Category:
              </span>
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  category === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setCategory('students')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                  category === 'students'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Students ({students.length})
              </button>
              <button
                onClick={() => setCategory('teachers')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                  category === 'teachers'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Faculty ({teachers.length})
              </button>
              <button
                onClick={() => setCategory('documents')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                  category === 'documents'
                    ? 'bg-purple-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Documents & Circulars
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {!query.trim() ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Global Search Ready</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Search instantly by student name, roll number, class name, faculty member, subject, or document ID.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                      💡 Try: "10" (Class 10)
                    </span>
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                      💡 Try: "ST-1002"
                    </span>
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                      💡 Try: "Maths"
                    </span>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-bold text-slate-300">No matching records found for "{query}"</p>
                  <p className="text-xs text-slate-400">
                    Check spelling or try searching by class number, roll number, or phone number.
                  </p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={`${item.type}-${item.id}-${idx}`}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500/80 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type Icon Badge */}
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-amber-400">
                          {item.type === 'student' && <GraduationCap className="w-5 h-5 text-cyan-400" />}
                          {item.type === 'teacher' && <Users className="w-5 h-5 text-amber-400" />}
                          {item.type === 'admission' && <ClipboardList className="w-5 h-5 text-emerald-400" />}
                          {item.type === 'notice' && <Megaphone className="w-5 h-5 text-purple-400" />}
                          {item.type === 'online_class' && <Video className="w-5 h-5 text-indigo-400" />}
                          {item.type === 'online_exam' && <FileQuestion className="w-5 h-5 text-rose-400" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-extrabold ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(item);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Quick View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Showing {results.length} result(s)</span>
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>Enter Inspect</span>
                <span>ESC Close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Inspection Detail Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b182e] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                  {inspectItem.type === 'student' && <GraduationCap className="w-6 h-6 text-cyan-400" />}
                  {inspectItem.type === 'teacher' && <Users className="w-6 h-6 text-amber-400" />}
                  {inspectItem.type === 'admission' && <ClipboardList className="w-6 h-6 text-emerald-400" />}
                  {inspectItem.type === 'notice' && <Megaphone className="w-6 h-6 text-purple-400" />}
                  {inspectItem.type === 'online_class' && <Video className="w-6 h-6 text-indigo-400" />}
                  {inspectItem.type === 'online_exam' && <FileQuestion className="w-6 h-6 text-rose-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-heading">{inspectItem.title}</h3>
                  <span className={`inline-block mt-0.5 text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold ${inspectItem.badgeColor}`}>
                    {inspectItem.badge}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Detail Grid */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspectItem.details.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">
                      {d.label}
                    </span>
                    <span className="text-xs font-bold text-white break-words">{d.value || 'N/A'}</span>
                  </div>
                ))}
              </div>

              {/* Extra text preview if notice or application message */}
              {inspectItem.type === 'notice' && inspectItem.rawObject.content && (
                <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1">
                    Notice Text Content
                  </span>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{inspectItem.rawObject.content}</p>
                </div>
              )}

              {inspectItem.type === 'admission' && inspectItem.rawObject.message && (
                <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1">
                    Application Note / Query
                  </span>
                  <p className="text-xs text-slate-300">{inspectItem.rawObject.message}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleCopyText(inspectItem.id, inspectItem.id)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 font-bold transition-all flex items-center gap-1.5"
              >
                {copiedId === inspectItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Record ID
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Record ID ({inspectItem.id})
                  </>
                )}
              </button>

              <button
                onClick={() => handleJumpToTab(inspectItem)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Jump to Tab & View Full Record</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
