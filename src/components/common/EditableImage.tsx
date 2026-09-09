import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import {
  Camera, Image as ImageIcon, Upload, Check, X,
  RefreshCw, Sparkles, Link as LinkIcon
} from 'lucide-react';

export interface EditableImageProps {
  src: string;
  alt: string;
  className?: string;
  onSaveImage?: (newUrl: string) => void;
  blockKey?: string;
  aspectRatio?: string;
  isVideo?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
}

const SCHOOL_PHOTO_PRESETS = [
  {
    title: 'Campus & Main Building',
    url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Smart Classroom & Students',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Computer & AI Science Lab',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Science Laboratory',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Library & Reading Hall',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Sports & Athletic Grounds',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'School Bus & Transport',
    url: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&q=80&w=1200'
  },
  {
    title: 'Director & Principal Portrait',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Graduation & Awards Ceremony',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200'
  }
];

export const EditableImage: React.FC<EditableImageProps> = React.memo(({
  src,
  alt,
  className = '',
  onSaveImage,
  blockKey,
  isVideo = false,
  loading = 'lazy',
  decoding
}) => {
  const { isEditMode } = useAuth();
  const { getContentBlock, updateContentBlock } = useCMS();

  // If a blockKey is given, pull dynamic image from CMS
  const currentSrc = blockKey ? getContentBlock(blockKey, src) : src;

  const [isLoaded, setIsLoaded] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(currentSrc);
  const [activeTab, setActiveTab] = useState<'presets' | 'url' | 'upload'>('presets');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftUrl(currentSrc);
    setHasError(false);
  }, [currentSrc]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoaded(true);
    setHasError(true);
  };

  const handleSave = async (urlToSave?: string) => {
    const finalUrl = (urlToSave || draftUrl).trim();
    if (!finalUrl) return;

    setIsSaving(true);
    try {
      if (onSaveImage) {
        onSaveImage(finalUrl);
      }
      if (blockKey) {
        await updateContentBlock(blockKey, finalUrl);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save image:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setDraftUrl(result);
        setActiveTab('url');
      }
    };
    reader.readAsDataURL(file);
  };

  if (isVideo) {
    return <video src={currentSrc} className={className} autoPlay loop muted playsInline />;
  }

  const isEager = loading === 'eager';

  return (
    <>
      <div
        onClick={(e) => {
          if (isEditMode) {
            e.stopPropagation();
            setDraftUrl(currentSrc);
            setModalOpen(true);
          }
        }}
        className={`relative w-full h-full overflow-hidden select-none ${
          isEditMode
            ? 'cursor-pointer group/img-edit outline-dashed outline-2 outline-amber-400/80 hover:outline-amber-500 transition-all rounded'
            : ''
        }`}
      >
        {hasError ? (
          <div
            className={`w-full h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ${className}`}
          >
            <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
            <span className="text-xs font-medium">{alt || 'Image unavailable'}</span>
          </div>
        ) : (
          <img
            src={currentSrc}
            alt={alt}
            loading={loading}
            decoding={decoding || 'async'}
            referrerPolicy="no-referrer"
            {...(isEager ? { fetchPriority: 'high' as const } : {})}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`${className} transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-80'
            }`}
          />
        )}

        {/* Edit Overlay (Shown when Edit Mode is ON) */}
        {isEditMode && (
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img-edit:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-auto">
            <div className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 text-xs transform scale-95 group-hover/img-edit:scale-100 transition-transform">
              <Camera className="w-4 h-4" />
              <span>Change Photo</span>
            </div>
          </div>
        )}
      </div>

      {/* Image Replacement Modal */}
      {modalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Edit & Replace Image
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {alt || 'Website visual asset'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 flex gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'presets'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>School Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'url'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Paste Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload From Device</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Active Tab: Presets */}
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose from curated high-definition school photography:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SCHOOL_PHOTO_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDraftUrl(preset.url);
                        }}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          draftUrl === preset.url
                            ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {preset.title}
                          </p>
                        </div>
                        {draftUrl === preset.url && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Tab: URL */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Direct Image Web Address (URL)
                  </label>
                  <input
                    type="url"
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Tip: You can use links from Unsplash, Imgur, or your school's Google Cloud storage.
                  </p>
                </div>
              )}

              {/* Active Tab: Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-500/5 transition flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Click to browse or drop an image
                    </span>
                    <span className="text-xs text-slate-500">
                      PNG, JPG, WebP or SVG up to 10MB
                    </span>
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  Preview
                </span>
                <div className="aspect-[16/9] max-h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                  {draftUrl ? (
                    <img
                      src={draftUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                      onError={() => alert('Could not load image from this URL. Please check the link.')}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || !draftUrl}
                onClick={() => handleSave()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply & Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
