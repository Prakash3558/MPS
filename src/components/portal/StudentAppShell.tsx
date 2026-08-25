import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { StudentPortal } from './StudentPortal';
import {
  GraduationCap, Moon, Sun, LogOut, Download, Globe,
  Shield, Smartphone, Sparkles, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import { promptInstallApp, subscribeInstallPrompt, isStandaloneApp } from '../../lib/pwa';
import { AppDownloadModal } from '../common/AppDownloadModal';

export const StudentAppShell: React.FC = () => {
  const { student, user, logout } = useAuth();
  const { settings } = useCMS();
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isStandalone, setIsStandalone] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mps_dark_mode');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    setIsStandalone(isStandaloneApp());
    const unsubscribe = subscribeInstallPrompt((available) => {
      setCanInstall(available);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstallApp();
    } else {
      setDownloadModalOpen(true);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Native App Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-white/20 flex-shrink-0">
              <img
                src={settings?.logo_url || '/logo.svg'}
                alt="MPS Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white leading-tight font-heading flex items-center gap-1.5">
                  <span>{settings?.school_name || 'Model Public School'}</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  <Smartphone className="w-3 h-3" /> Student App
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  {isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">Offline Mode</span>
                    </>
                  )}
                </span>
                {student && (
                  <span className="text-slate-500">· Class {student.class}-{student.section} (Roll {student.rollNo})</span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Install App Button if not already standalone */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md transition-all border border-amber-400"
                title="Download / Install Student App on your Phone or PC"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Refresh App State */}
            <button
              onClick={handleReload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Student Logged In Status / Logout */}
            {(student || user) ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all border border-rose-500/40"
                title="Sign Out of Student Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : null}

            {/* Return to Full Website Link */}
            <a
              href="/"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 text-xs font-semibold flex items-center gap-1"
              title="Visit Full Public School Website"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">School Website</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Student Portal Content View - Exclusively Student Content */}
      <main className="flex-grow w-full">
        <StudentPortal />
      </main>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </div>
  );
};
