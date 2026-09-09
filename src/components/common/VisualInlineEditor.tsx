import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import {
  Sparkles, Check, Eye, X, Edit3, Camera,
  RefreshCw, Save, Layers, HelpCircle
} from 'lucide-react';
import { EditableImage } from './EditableImage';

export const VisualInlineEditor: React.FC = () => {
  const { isEditMode, toggleEditMode } = useAuth();
  const { settings, updateSettings, updateContentBlock, getContentBlock } = useCMS();

  const [highlightAll, setHighlightAll] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBlocksModal, setShowBlocksModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'images' | 'info'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Global highlight toggle
  useEffect(() => {
    if (!isEditMode) {
      document.body.classList.remove('mps-highlight-editable');
      return;
    }
    if (highlightAll) {
      document.body.classList.add('mps-highlight-editable');
    } else {
      document.body.classList.remove('mps-highlight-editable');
    }
  }, [isEditMode, highlightAll]);

  if (!isEditMode) {
    return null;
  }

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      if (settings) {
        await updateSettings(settings);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save all CMS settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const contentBlocks = settings?.content_blocks || {};
  const blockEntries = Object.entries(contentBlocks).filter(([key, val]) =>
    key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    val.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Floating Visual Edit Announcement Bar */}
      <aside aria-label="Visual editor bar" className="fixed top-0 left-0 right-0 z-[95] bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 px-3 sm:px-4 py-2 shadow-xl border-b border-amber-400/50 flex items-center justify-between gap-3 text-xs font-sans transition-all animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex items-center gap-1.5 font-extrabold bg-slate-950 text-amber-400 px-2.5 py-1 rounded-full text-[11px] shadow-sm uppercase tracking-wider">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Visual Edit ON</span>
          </span>
          <p className="hidden md:inline font-medium text-slate-950 text-xs truncate">
            Click on any text to type & edit live. Click any photo to change it. Click any icon to change it.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Highlight All Elements Button */}
          <button
            type="button"
            onClick={() => setHighlightAll(!highlightAll)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              highlightAll
                ? 'bg-slate-950 text-white ring-2 ring-white/50'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
            title="Highlight all editable elements on the page"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{highlightAll ? 'Hide Outlines' : 'Highlight All'}</span>
          </button>

          {/* View All Content Blocks */}
          <button
            type="button"
            onClick={() => setShowBlocksModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Browse and edit all text blocks in a table"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">All Blocks</span>
          </button>

          {/* Quick Help Guide */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="p-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer"
            title="How to edit"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Save All */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
            title="Save all changes to database"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Saved!' : 'Save All'}</span>
          </button>

          {/* Done / Exit Edit Mode */}
          <button
            type="button"
            onClick={toggleEditMode}
            className="p-1 rounded-lg hover:bg-amber-400 text-slate-950 transition cursor-pointer"
            title="Finish and exit Edit Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Guide Popover */}
      {showGuide && (
        <div className="fixed top-12 right-4 z-[105] w-80 bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>How To Edit Your Website</span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span><strong>Edit Text:</strong> Simply click or hover on any headline, tagline, notice, or paragraph with an amber outline. Type your change, and click <em>Save</em> or press Enter.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span><strong>Change Photos:</strong> Hover over any banner, logo, facility, or gallery image and click <em>Change Photo</em>. You can paste a link, upload from phone/PC, or pick from presets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span><strong>Change Icons:</strong> Click on any badge icon to open the icon library and pick from 30+ symbols and color accents.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">4.</span>
              <span><strong>Theme & Fonts:</strong> Use the floating bottom toolbar to switch theme color palettes and typography.</span>
            </li>
          </ul>
        </div>
      )}

      {/* All Content Blocks Drawer / Modal */}
      {showBlocksModal && (
        <div
          onClick={() => setShowBlocksModal(false)}
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl p-6 flex flex-col max-h-[85vh] animate-in zoom-in-95 text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Website Content Blocks Manager</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Directly modify any customized text or block key stored in the CMS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlocksModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content by key or text..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="overflow-y-auto flex-grow space-y-3 pr-1">
              {blockEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No customized blocks yet. Click directly on any text or image on the page to customize it!
                </div>
              ) : (
                blockEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {key}
                      </span>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => updateContentBlock(key, e.target.value)}
                      rows={Math.max(1, value.split('\n').length)}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-sans focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowBlocksModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
