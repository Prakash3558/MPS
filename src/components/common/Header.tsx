import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';
import { EditableText } from './EditableText';
import { EditableImage } from './EditableImage';
import { Shield, Phone, Mail, UserCheck, GraduationCap, School, Menu, X, ShieldAlert, Moon, Sun, LogOut, Download, Smartphone, Bus } from 'lucide-react';
import { api } from '../../lib/api';
import { AppDownloadModal } from './AppDownloadModal';

export const Header: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const { user, teacher, student, staff, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teacherMenuOpen, setTeacherMenuOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mps_dark_mode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
      return true;
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
      return false;
    }
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mps_dark_mode', 'false');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mps_dark_mode', 'true');
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all duration-300">
      {/* Top Info Bar - Figma Refined Aesthetic */}
      <div className="bg-slate-50/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 text-[11px] py-1.5 px-4 hidden sm:block border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <a
              href={`tel:${(settings?.phones || '+918757968130').split(',')[0].trim()}`}
              className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{settings?.phones || '+91 87579 68130, +91 91620 24642'}</span>
            </a>
            <a
              href={`mailto:${settings?.email || 'modelpublicschool@gmail.com'}`}
              className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{settings?.email || 'modelpublicschool@gmail.com'}</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              CBSE Affiliation No: {settings?.cbse_affiliation || '330854'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden md:inline">
              📍 Bhawanipur, Sikta, West Champaran
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar - Ultra-sleek single-line mobile layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-12 sm:h-16 flex items-center justify-between gap-2 flex-nowrap">
        {/* Brand Logo & Title - Compact 1-line on mobile */}
        <a href="/" className="flex items-center gap-1.5 sm:gap-3 group min-w-0 flex-shrink hover:opacity-95 transition-opacity">
          <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 text-slate-900 flex items-center justify-center shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex-shrink-0 overflow-hidden p-0.5 sm:p-1 transition-transform group-hover:scale-105">
            <EditableImage
              src={settings?.logo_url || '/logo.svg'}
              alt={settings?.school_name ? `${settings.school_name} Logo` : 'MPS Logo'}
              loading="eager"
              decoding="async"
              onSaveImage={(newUrl) => updateSettings({ logo_url: newUrl })}
              blockKey="logo_url"
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white leading-none sm:leading-tight font-heading tracking-tight truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
              <EditableText blockKey="header.schoolName" defaultText={settings?.school_name || 'Model Public School'} />
            </h1>
            <p className="hidden sm:flex text-[10.5px] text-slate-500 dark:text-slate-400 font-medium tracking-wide items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <EditableText blockKey="header.locationBadge" defaultText="MPS Sikta, West Champaran" />
            </p>
          </div>
        </a>

        {/* Navigation Links Desktop */}
        <nav className="hidden lg:flex items-center gap-1 font-medium text-xs text-slate-600 dark:text-slate-300">
          <a href="/#about" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">About</a>
          <a href="/#faculty" onMouseEnter={api.prefetchTeachers} className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Faculty</a>
          <a href="/#facilities" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Facilities</a>
          <a href="/#gallery" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Gallery</a>
          <a href="/#fees" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Fees</a>
          <a href="/#faq" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">FAQ</a>
          <a href="/#admissions" onMouseEnter={api.prefetchAdmissions} className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-blue-600 dark:text-blue-400">Admissions</a>
          <a href="/#contact" className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Contact</a>
        </nav>

        {/* Portal Login Action Buttons & Theme Switcher - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/80 dark:border-slate-700/80 active:scale-95 cursor-pointer"
            title="Toggle Dark / Light Mode"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" /> : <Moon className="w-4 h-4 text-slate-700 transition-transform -rotate-12 hover:rotate-0" />}
          </button>

          {/* Minimal Download App Button */}
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
            title="Download Model Public School App"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-950" />
            <span>App</span>
          </button>

          {(user || teacher || student || staff) ? (
            <div className="flex items-center gap-2">
              <a
                href={staff ? '/staff' : (student ? '/portal' : (teacher ? '/teacher' : '/admin'))}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all shadow-xs"
                title="Go directly to your active dashboard"
              >
                {staff ? (
                  <Bus className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                ) : student ? (
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                ) : teacher ? (
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{staff ? 'Driver Portal' : 'My Dashboard'}</span>
              </a>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 py-1 pl-1.5 pr-1 rounded-full border border-slate-200 dark:border-slate-700/80">
                {/* Profile Picture / Avatar Icon */}
                <div className="relative flex-shrink-0">
                  {student?.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow-xs"
                    />
                  ) : teacher?.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow-xs"
                    />
                  ) : staff?.photo ? (
                    <img
                      src={staff.photo}
                      alt={staff.name}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400 shadow-xs"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
                      {(user?.name || teacher?.name || student?.name || staff?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full"></span>
                </div>

                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
                      {staff ? `${staff.role}: ${staff.vehicleNumber || 'Staff'}` : student ? `Class ${student.class}-${student.section}` : (teacher ? `Class ${teacher.assignedClass}-${teacher.assignedSection}` : 'Admin')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] block">
                    {user?.name || teacher?.name || student?.name || staff?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white font-bold text-[11px] px-2 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 transition-all cursor-pointer ml-1"
                  title="Sign out of this device"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Student Profile / Portal Button */}
              <a
                href="/portal"
                onMouseEnter={() => { api.prefetchStudents(); api.prefetchNotices(); }}
                onFocus={() => { api.prefetchStudents(); api.prefetchNotices(); }}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-full transition-all shadow-xs"
                title="Open Student Profile & Portal"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                <span>Student Profile</span>
              </a>

              {/* Teacher / Staff portal dropdown menu */}
              <div className="relative group">
                <a
                  href="/teacher"
                  onMouseEnter={() => { api.prefetchTeachers(); api.prefetchStudents(); }}
                  onFocus={() => { api.prefetchTeachers(); api.prefetchStudents(); }}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Teacher & Staff</span>
                </a>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 hidden group-hover:block hover:block z-50 animate-in fade-in-50 duration-150">
                  <a
                    href="/teacher"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-bold">Teacher Portal</div>
                      <div className="text-[10px] text-slate-400">Classroom & Faculty</div>
                    </div>
                  </a>
                  <a
                    href="/staff"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 transition-colors mt-1"
                  >
                    <Bus className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold">Staff & Driver Portal</div>
                      <div className="text-[10px] text-slate-400">Bus tracking & Students</div>
                    </div>
                  </a>
                </div>
              </div>

              <a
                href="/admin"
                onMouseEnter={() => { api.prefetchTeachers(); api.prefetchAdmissions(); api.prefetchNotices(); }}
                onFocus={() => { api.prefetchTeachers(); api.prefetchAdmissions(); api.prefetchNotices(); }}
                className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin</span>
              </a>
            </>
          )}
        </div>

        {/* Mobile Controls - Ultra Sleek Single-Line Layout */}
        <div className="flex sm:hidden items-center gap-1.5 flex-shrink-0">
          {(user || teacher || student || staff) ? (
            <a
              href={staff ? '/staff' : (student ? '/portal' : (teacher ? '/teacher' : '/admin'))}
              className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs active:scale-95 transition-transform"
              title="Go to My Dashboard"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse"></span>
              <span>Dashboard</span>
            </a>
          ) : (
            <a
              href="/portal"
              className="flex items-center gap-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] px-2.5 py-1 rounded-full shadow-xs active:scale-95 transition-transform"
              title="Student Profile & Portal"
            >
              <GraduationCap className="w-3 h-3 text-amber-400" />
              <span>Student</span>
            </a>
          )}

          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition-transform"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 space-y-3 text-sm font-medium animate-in slide-in-from-top-3 duration-200">
          {(user || teacher || student) ? (
            <div className="bg-slate-100 dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center gap-3">
                {/* Profile Photo Avatar */}
                <div className="relative flex-shrink-0">
                  {student?.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                    />
                  ) : teacher?.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-sm">
                      {(user?.name || teacher?.name || student?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                      {student ? `Class ${student.class}-${student.section}` : (teacher ? `Teacher: Class ${teacher.assignedClass}-${teacher.assignedSection}` : 'Admin')}
                    </span>
                    {student?.rollNo && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        Roll: {student.rollNo}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {user?.name || teacher?.name || student?.name}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <a
                  href={student ? '/portal' : (teacher ? '/teacher' : '/admin')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs py-2 rounded-xl shadow-xs"
                >
                  <span>Open My Dashboard</span>
                </a>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Top Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pb-1">
            <a
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Student Portal</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setDownloadModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download App</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pb-2">
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              About Us
            </a>
            <a
              href="/#faculty"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              Faculty
            </a>
            <a
              href="/#facilities"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              Facilities
            </a>
            <a
              href="/#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              Gallery
            </a>
            <a
              href="/#fees"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              Fee Structure
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold"
            >
              FAQ
            </a>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <a
              href="/#admissions"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-center shadow-xs text-xs"
            >
              Apply for Admission
            </a>

            <div className="grid grid-cols-3 gap-1.5">
              <a
                href="/teacher"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Teacher
              </a>
              <a
                href="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold py-2 rounded-xl text-xs border border-amber-500/30"
              >
                <Bus className="w-3.5 h-3.5 text-amber-500" /> Driver
              </a>
              <a
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Admin
              </a>
            </div>
          </div>
        </div>
      )}

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </header>
  );
});
