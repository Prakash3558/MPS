import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Clock, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface FloatingAdminSaveBarProps {
  onSave: () => Promise<void> | void;
  hasUnsavedChanges?: boolean;
  lastSavedTime?: Date | null;
  autoSaveIntervalSeconds?: number;
  label?: string;
}

export const FloatingAdminSaveBar: React.FC<FloatingAdminSaveBarProps> = React.memo(({
  onSave,
  hasUnsavedChanges = false,
  lastSavedTime = null,
  autoSaveIntervalSeconds = 30,
  label = 'Admin Auto-Save Active'
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [countdown, setCountdown] = useState(autoSaveIntervalSeconds);
  const [lastSavedFormatted, setLastSavedFormatted] = useState<string>('');

  const onSaveRef = useRef(onSave);
  const hasUnsavedRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    hasUnsavedRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Update last saved timestamp string
  useEffect(() => {
    if (lastSavedTime) {
      setLastSavedFormatted(
        lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [lastSavedTime]);

  // Handle Manual Save
  const handleTriggerSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSaveRef.current();
      setJustSaved(true);
      setCountdown(autoSaveIntervalSeconds);
      const now = new Date();
      setLastSavedFormatted(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      console.error('Failed to trigger save:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // 30-Second Auto-Save Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time to auto-save if there are changes or as periodic auto-sync!
          handleTriggerSave();
          return autoSaveIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSaveIntervalSeconds]);

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex items-center gap-2 max-w-[92vw] sm:max-w-md animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* Floating Glass Pill Container */}
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md p-2 pl-3.5 pr-2 rounded-2xl border border-amber-500/40 shadow-2xl shadow-slate-950/60 flex items-center justify-between gap-3 font-sans text-xs sm:text-sm">
        
        {/* Auto-Save Live Status & Countdown Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            ) : justSaved ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            ) : hasUnsavedChanges ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
            )}
          </div>

          <div className="flex flex-col min-w-0 text-left">
            <div className="flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase text-slate-300">
              <span>{isSaving ? 'Saving...' : justSaved ? 'Saved to Cloud' : hasUnsavedChanges ? 'Unsaved Edits' : 'All Changes Saved'}</span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium whitespace-nowrap">
              <Clock className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
              <span>
                Auto-save in <strong className="text-amber-300 font-bold">{countdown}s</strong>
                {lastSavedFormatted && <span className="hidden xs:inline text-slate-500 ml-1">({lastSavedFormatted})</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Save Button - Positioned at Right Side Floating Above Mobile Keyboard */}
        <button
          type="button"
          onClick={handleTriggerSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 shadow-lg cursor-pointer flex-shrink-0 active:scale-95 ${
            justSaved
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              : hasUnsavedChanges
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300/50 animate-pulse'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
          }`}
          title="Save all admin edits immediately"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="hidden xs:inline">Saving...</span>
            </>
          ) : justSaved ? (
            <>
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Saved ✓</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-950" />
              <span>Save Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
