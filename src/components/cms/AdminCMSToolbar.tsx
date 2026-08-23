import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { Edit3, Palette, Type, Layout, ShieldCheck, Download, Settings, ChevronDown, Check, LogOut, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminCMSToolbar: React.FC = () => {
  const { user, isEditMode, toggleEditMode, logout } = useAuth();
  const { settings, updateSettings, syncStatus, lastSavedAt } = useCMS();

  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);

  if (!user || user.role !== 'admin') return null;

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

  const downloadSQLDump = () => {
    window.open('/api/export-sql', '_blank');
  };

  return (
    <>
      {/* Top Right Save Toast Notification */}
      {syncStatus === 'saved' && (
        <div className="fixed top-5 right-5 z-[100] bg-emerald-900/95 text-white border border-emerald-500/60 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-xs text-emerald-200">Save Successful</p>
            <p className="text-[11px] text-emerald-300/80">CMS changes synchronized with Firestore</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl w-[92%] bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-bottom-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <span>Admin Controls</span>
          </div>

          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all shadow ${
              isEditMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Mode: {isEditMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live Firestore Sync Status Indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {syncStatus === 'saving' && (
              <div className="flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-xl text-xs font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Saving to Firestore...</span>
              </div>
            )}

            {syncStatus === 'saved' && (
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Changes Saved</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2.5 py-1 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Sync Error</span>
              </div>
            )}

            {syncStatus === 'synced' && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 text-slate-400 border border-slate-700/80 px-2.5 py-1 rounded-xl text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firestore Synced</span>
              </div>
            )}
          </div>
        </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setColorMenuOpen(!colorMenuOpen);
              setFontMenuOpen(false);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-medium"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Theme Colors</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {colorMenuOpen && (
            <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl w-64 z-50 text-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preset Palettes</span>
              <div className="space-y-1.5">
                {themePresets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(p)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
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
                <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Custom Primary Pick</span>
                <input
                  type="color"
                  value={settings?.theme_colors?.primary || '#1e3a8a'}
                  onChange={e =>
                    updateSettings({
                      theme_colors: { ...settings?.theme_colors!, primary: e.target.value }
                    })
                  }
                  className="w-full h-8 rounded cursor-pointer bg-slate-800 border-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Font Control */}
        <div className="relative">
          <button
            onClick={() => {
              setFontMenuOpen(!fontMenuOpen);
              setColorMenuOpen(false);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-medium"
          >
            <Type className="w-4 h-4 text-emerald-400" />
            <span>Fonts</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {fontMenuOpen && (
            <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl w-56 z-50 text-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Heading Font</span>
              <div className="space-y-1 mb-3">
                {fontOptions.map(font => (
                  <button
                    key={font}
                    onClick={() => updateSettings({ font_heading: font })}
                    className={`w-full flex items-center justify-between p-1.5 rounded text-xs text-left ${
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
                    onClick={() => updateSettings({ font_body: font })}
                    className={`w-full flex items-center justify-between p-1.5 rounded text-xs text-left ${
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

        {/* Quick Dashboard */}
        <a
          href="/admin"
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-medium"
        >
          <Settings className="w-4 h-4" />
          <span>Admin Center</span>
        </a>

        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
          title="Exit Admin Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  </>
  );
};
