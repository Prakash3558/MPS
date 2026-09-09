import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import { Edit3, Check, X, RotateCcw } from 'lucide-react';

interface EditableTextProps {
  blockKey: string;
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = React.memo(({
  blockKey,
  defaultText,
  className = '',
  as = 'span',
  multiline = false
}) => {
  const { isEditMode } = useAuth();
  const { getContentBlock, updateContentBlock } = useCMS();

  const textValue = getContentBlock(blockKey, defaultText);

  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(textValue);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraftText(textValue);
  }, [textValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (draftText === textValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateContentBlock(blockKey, draftText);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update content block:', err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDraftText(textValue);
    setIsEditing(false);
  };

  const handleResetToDefault = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftText(defaultText);
    setIsSaving(true);
    try {
      await updateContentBlock(blockKey, defaultText);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Failed to reset content block:', err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const Component = as;

  // Non-edit mode: render standard semantic tag
  if (!isEditMode) {
    if (!textValue) return null;
    return <Component className={className}>{textValue}</Component>;
  }

  // Active editing state
  if (isEditing) {
    return (
      <span
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative inline-block w-full max-w-full z-30"
      >
        {/* Floating Quick-Actions Toolbar */}
        <span className="absolute -top-9 left-0 z-40 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-lg shadow-xl border border-amber-500/80 text-[11px] font-sans font-medium animate-in fade-in zoom-in-95 pointer-events-auto">
          <span className="text-amber-400 font-bold flex items-center gap-1 pr-1 border-r border-slate-700">
            <Edit3 className="w-3 h-3" />
            <span>Editing</span>
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition"
            title="Save changes (or press Enter)"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCancel}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer transition"
            title="Cancel changes (Escape)"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          {defaultText !== textValue && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleResetToDefault}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 cursor-pointer transition"
              title="Reset to default text"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </span>

        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, draftText.split('\n').length)}
            className={`w-full p-2 bg-amber-50/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-2 border-amber-500 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-inherit ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-1.5 bg-amber-50/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-2 border-amber-500 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-inherit ${className}`}
          />
        )}
      </span>
    );
  }

  // Edit mode is ON, but element is currently displaying text with hover affordances
  return (
    <Component
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title={`Click to edit: "${textValue}"`}
      className={`${className} cursor-text relative inline-block rounded transition-all duration-150 group/editable outline-dashed outline-2 outline-amber-400/80 hover:outline-amber-500 hover:bg-amber-500/15 hover:shadow-xs px-0.5 -mx-0.5 ${
        justSaved ? 'ring-2 ring-emerald-500 bg-emerald-500/20' : ''
      }`}
    >
      {textValue}
      {/* Floating Hover Badge */}
      <span className="opacity-0 group-hover/editable:opacity-100 transition-opacity duration-150 absolute -top-5 right-0 z-20 bg-amber-500 text-slate-950 font-sans text-[10px] font-bold px-1.5 py-0.2 rounded shadow-md pointer-events-none flex items-center gap-0.5 whitespace-nowrap">
        <Edit3 className="w-2.5 h-2.5" />
        <span>Edit</span>
      </span>
      {justSaved && (
        <span className="absolute -top-5 left-0 z-20 bg-emerald-600 text-white font-sans text-[10px] font-bold px-1.5 py-0.2 rounded shadow-md pointer-events-none flex items-center gap-0.5">
          <Check className="w-2.5 h-2.5" />
          <span>Saved</span>
        </span>
      )}
    </Component>
  );
});
