import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import {
  Edit3, Palette, Type, ShieldCheck, Settings, ChevronDown, Check,
  LogOut, RefreshCw, CheckCircle2, AlertCircle, Save
} from 'lucide-react';

export const AdminCMSToolbar: React.FC = () => {
  const { user, isEditMode, toggleEditMode, logout } = useAuth();
  const { settings, updateSettings, syncStatus, lastSavedAt } = useCMS();

  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Check if user is logged in as admin OR has visited/authenticated in the admin panel
  const [adminActive, setAdminActive] = useState<boolean>(() => {
    try {
      return (
        user?.role === 'admin' ||
        localStorage.getItem('mps_admin_mode') === 'true' ||
        sessionStorage.getItem('mps_admin_mode') === 'true'
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkAdmin = () => {
      const isAdmin =
        user?.role === 'admin' ||
        localStorage.getItem('mps_admin_mode') === 'true' ||
        sessionStorage.getItem('mps_admin_mode') === 'true';
      setAdminActive(isAdmin);
    };

    checkAdmin();
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, [user]);

  // If not in admin mode, do not render floating toolbar
  if (!adminActive && (!user || user.role !== 'admin')) {
    return null;
  }

  const fontOptions = ['Outfit', 'Plus Jakarta Sans', 'Playfair Display', 'Montserrat', 'Inter', 'Roboto'];

  const themePresets = [
    { name: 'Warm Academic', primary: '#1e3a8a', secondary: '#d97706', accent: '#0d9488', bg: '#fcfbf7', card: '#ffffff', text: '#1e293b' },
    { name: 'Royal Indigo', primary: '#3730a3', secondary: '#f59e0b', accent: '#0284c7', bg: '#f8fafc', card: '#ffffff', text: '#0f172a' },
    { name: 'Emerald Prestige', primary: '#065f46', secondary: '#ca8a04', accent: '#0891b2', bg: '#f0fdf4', card: '#ffffff', text: '#064e3b' },
    { name: 'Sunset Amber', primary: '#9a3412', secondary: '#d97706', accent: '#2563eb', bg: '#fff7ed', card: '#ffffff', text: '#431407' }
  ];

  const applyPreset = (preset: typeof themePresets[0]) => {
    updateSettings({
      theme_colors: {
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent,
        background: preset.bg,
        cardBg: preset.card,
        text: preset.text
      }
    });
  };

  const handleManualSave = async () => {
    if (isManualSaving) return;
    setIsManualSaving(true);
    try {
      await updateSettings({});
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Failed to trigger manual save:', err);
    } finally {
      setIsManualSaving(false);
    }
  };

  const handleExitAdmin = () => {
    try {
      localStorage.removeItem('mps_admin_mode');
      sessionStorage.removeItem('mps_admin_mode');
    } catch {}
    setAdminActive(false);
    logout();
  };

  return (
    <>
      {/* Top Right Save Toast Notification */}
      {(syncStatus === 'saved' || justSaved) && (
        <div className="fixed top-5 right-5 z-[100] bg-emerald-900/95 text-white border border-emerald-500/60 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-xs text-emerald-200">Changes Saved</p>
            <p className="text-[11px] text-emerald-300/80">Synchronized with database & cloud</p>
          </div>
        </div>
      )}

      <aside
        aria-label="Admin Floating Toolbar"
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-5xl w-[94%] bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/40 shadow-slate-950/80 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm animate-in slide-in-from-bottom-6 pointer-events-auto"
      >
        {/* Left Section: Admin Identity, Edit Mode, Save Button & Sync Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Admin Controls</span>
          </div>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={toggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow cursor-pointer ${
              isEditMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Toggle inline website editing"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit: {isEditMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Dedicated Manual Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={isManualSaving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow cursor-pointer active:scale-95 ${
              justSaved
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30 ring-1 ring-amber-300'
            }`}
            title="Save all changes to database immediately"
          >
            {isManualSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Live Sync Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            {syncStatus === 'saving' && (
              <span className="text-sky-300 flex items-center gap-1 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Syncing...</span>
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Synced</span>
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Sync Error</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Theme Picker, Fonts, Admin Center, and Exit */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setColorMenuOpen(!colorMenuOpen);
                setFontMenuOpen(false);
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-medium cursor-pointer"
              title="Change theme colors"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Theme</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {colorMenuOpen && (
              <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl w-64 z-50 text-slate-100 animate-in fade-in zoom-in-95">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preset Palettes</span>
                <div className="space-y-1.5">
                  {themePresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <span className="font-medium text-xs">{p.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primary }}></span>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.secondary }}></span>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.accent }}></span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Custom Primary Color</span>
                  <input
                    type="color"
                    value={settings?.theme_colors?.primary || '#1e3a8a'}
                    onChange={e =>
                      updateSettings({
                        theme_colors: { ...settings?.theme_colors!, primary: e.target.value }
                      })
                    }
                    className="w-full h-8 rounded-lg cursor-pointer bg-slate-800 border-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Font Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFontMenuOpen(!fontMenuOpen);
                setColorMenuOpen(false);
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-medium cursor-pointer"
              title="Change heading and body typography"
            >
              <Type className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Fonts</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {fontMenuOpen && (
              <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl w-56 z-50 text-slate-100 animate-in fade-in zoom-in-95">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Heading Font</span>
                <div className="space-y-1 mb-3">
                  {fontOptions.map(font => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => updateSettings({ font_heading: font })}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-left cursor-pointer ${
                        settings?.font_heading === font ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-slate-800'
                      }`}
                    >
                      <span>{font}</span>
                      {settings?.font_heading === font && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pt-2 border-t border-slate-800">Body Font</span>
                <div className="space-y-1">
                  {fontOptions.map(font => (
                    <button
                      key={'body-' + font}
                      type="button"
                      onClick={() => updateSettings({ font_body: font })}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-left cursor-pointer ${
                        settings?.font_body === font ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'hover:bg-slate-800'
                      }`}
                    >
                      <span>{font}</span>
                      {settings?.font_body === font && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Control Center Link */}
          <a
            href="/admin"
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold transition shadow"
            title="Go to full Admin Dashboard"
          >
            <Settings className="w-4 h-4" />
            <span>Admin Center</span>
          </a>

          {/* Exit Admin Mode / Logout */}
          <button
            type="button"
            onClick={handleExitAdmin}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer transition"
            title="Exit Admin Toolbar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

