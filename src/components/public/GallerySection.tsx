import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import {
  Image as ImageIcon, X, Filter, Sparkles, Eye, ChevronRight, ChevronLeft
} from 'lucide-react';
import { GalleryItem } from '../../types';

export const GallerySection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const gallery = settings?.gallery || [];
  
  // Full Grid Lightbox Modal (opened ONLY via "See All" button)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Single Photo Modal (opened when clicking a specific photo card)
  const [selectedPhotoItem, setSelectedPhotoItem] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Campus', 'Academics', 'Events', 'Sports'];

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return gallery;
    return gallery.filter(item => item.category === activeCategory);
  }, [gallery, activeCategory]);

  // Interactive Auto-Moving Engine with Full Vertical Page Scrolling & Horizontal Swiping
  const trackRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const preciseScrollPosRef = useRef<number>(0);

  // Duplicate items 3 times for continuous seamless scrolling loop
  const loopGallery = gallery.length > 0
    ? [...gallery, ...gallery, ...gallery]
    : [];

  const pauseAutoMove = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const resumeAutoMoveDelayed = useCallback((delay = 2500) => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
      if (trackRef.current) {
        preciseScrollPosRef.current = trackRef.current.scrollLeft;
      }
    }, delay);
  }, []);

  // Sync scroll position whenever track scrolls naturally
  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    if (isInteractingRef.current) {
      preciseScrollPosRef.current = el.scrollLeft;
    }
  }, []);

  // Continuous buttery-smooth auto-motion loop using sub-pixel precision
  useEffect(() => {
    const el = trackRef.current;
    if (!el || gallery.length === 0) return;

    let animId: number;
    let lastTime: number | null = null;
    preciseScrollPosRef.current = el.scrollLeft;
    const pixelsPerSecond = 34; // Calibrated speed for comfortable viewing

    const animate = (currentTime: number) => {
      if (lastTime === null) {
        lastTime = currentTime;
      }
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // clamp
      lastTime = currentTime;

      if (!isInteractingRef.current && el) {
        const step = pixelsPerSecond * deltaTime;
        preciseScrollPosRef.current += step;

        const singleSetWidth = el.scrollWidth / 3;
        if (singleSetWidth > 50) {
          if (preciseScrollPosRef.current >= singleSetWidth * 2) {
            preciseScrollPosRef.current -= singleSetWidth;
          } else if (preciseScrollPosRef.current <= 0) {
            preciseScrollPosRef.current += singleSetWidth;
          }
        }

        el.scrollLeft = preciseScrollPosRef.current;
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [gallery.length]);

  // Compute exact step size for clean whole-card alignment on arrow clicks
  const getCardStep = useCallback(() => {
    if (!trackRef.current) return 360;
    const firstChild = trackRef.current.children[0] as HTMLElement | undefined;
    if (!firstChild) return 360;
    const secondChild = trackRef.current.children[1] as HTMLElement | undefined;
    if (secondChild) {
      const gap = secondChild.offsetLeft - (firstChild.offsetLeft + firstChild.offsetWidth);
      return firstChild.offsetWidth + gap;
    }
    return firstChild.offsetWidth + 20;
  }, []);

  // Clean navigation that aligns exactly to whole cards (no half-card cutoffs)
  const handleManualNav = (direction: 'left' | 'right') => {
    pauseAutoMove();
    if (!trackRef.current) return;
    const el = trackRef.current;
    const cardStep = getCardStep();
    
    // Snap to the exact whole card index
    const currentIndex = Math.round(el.scrollLeft / cardStep);
    const targetIndex = direction === 'left' ? Math.max(0, currentIndex - 1) : currentIndex + 1;
    const targetScrollLeft = targetIndex * cardStep;

    el.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });

    preciseScrollPosRef.current = targetScrollLeft;
    resumeAutoMoveDelayed(3500);
  };

  // Mouse Drag Support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftStartRef.current = trackRef.current.scrollLeft;
    pauseAutoMove();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !trackRef.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    const delta = x - startXRef.current;
    if (Math.abs(delta) > 6) {
      hasDraggedRef.current = true;
    }
    trackRef.current.scrollLeft = scrollLeftStartRef.current - delta * 1.3;
    preciseScrollPosRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      resumeAutoMoveDelayed(2000);
    }
  };

  const handleCardClick = (item: GalleryItem) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setSelectedPhotoItem(item);
  };

  return (
    <section id="gallery" className="py-14 sm:py-18 bg-slate-50 dark:bg-slate-900/60 transition-colors overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header with "See All" CTA and Navigation Arrows */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full inline-block">
              Campus Life
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
              <EditableText blockKey="gallery.heading" defaultText="Photo Gallery" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Glimpses of academic milestones, sports competitions, science fairs, and campus life.
            </p>
          </div>

          {/* Controls: Prev / Next & "See All" */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => handleManualNav('left')}
              className="p-2 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll gallery left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleManualNav('right')}
              className="p-2 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll gallery right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>All Photos ({gallery.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable & Auto-Moving Track with dual-axis touch support: pan-x pan-y allows both horizontal carousel swipe AND vertical page scroll */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onMouseEnter={pauseAutoMove}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={pauseAutoMove}
          onTouchEnd={() => resumeAutoMoveDelayed(2500)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-2 cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loopGallery.map((item, idx) => (
            <div
              key={`gallery-${item.id}-${idx}`}
              onClick={() => handleCardClick(item)}
              className="w-[85vw] max-w-[360px] sm:w-[360px] md:w-[380px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col relative"
            >
              {/* Photo Box */}
              <div className="aspect-[16/11] overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                <EditableImage
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
                
                {/* Category Badge */}
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 pointer-events-none">
                  {item.category}
                </span>

                {/* Hover / Tap Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 pointer-events-none">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-medium text-white">View Photo</span>
                </div>
              </div>

              {/* Card Caption */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-1 bg-white dark:bg-slate-900">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-heading line-clamp-1">
                    <EditableText blockKey={`gallery.${item.id}.title`} defaultText={item.title} />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-body">
                    <EditableText blockKey={`gallery.${item.id}.caption`} defaultText={item.caption} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SINGLE PHOTO MODAL (Opens ONLY when clicking an individual photo) */}
      {selectedPhotoItem && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoItem(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoItem(null)}
              className="absolute -top-12 right-0 text-white hover:text-amber-400 p-2 bg-slate-800/90 rounded-full transition-all cursor-pointer shadow-lg"
              title="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedPhotoItem.url}
                alt={selectedPhotoItem.title}
                loading="lazy"
                decoding="async"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
              />
            </div>

            <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {selectedPhotoItem.category}
                  </span>
                  <h4 className="font-black text-base sm:text-lg font-heading text-white">{selectedPhotoItem.title}</h4>
                </div>
                {selectedPhotoItem.caption && (
                  <p className="text-xs sm:text-sm text-slate-300">{selectedPhotoItem.caption}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPhotoItem(null);
                  setLightboxOpen(true);
                }}
                className="text-xs sm:text-sm text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1 flex-shrink-0 cursor-pointer bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
              >
                <span>Browse All Photos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX GALLERY MODAL (Opens ONLY when clicking "See All") */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 max-w-7xl w-full mx-auto text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl font-heading">Model Public School Media Gallery</h3>
                <p className="text-xs text-slate-400">Campus activities, laboratories, sports meets & events ({gallery.length} Photos)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Middle Content */}
          <div className="max-w-7xl w-full mx-auto my-auto py-4 overflow-y-auto max-h-[78vh] pr-1 space-y-6">
            {/* Category Filter Pills */}
            <div className="flex justify-start items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-slate-400" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of All Photos in Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPhotoItem(item)}
                  className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <EditableImage
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 pointer-events-none">
                      <Eye className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold">Zoom Photo</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      {item.category}
                    </span>
                    <h5 className="font-bold text-xs text-white line-clamp-1">{item.title}</h5>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 max-w-7xl w-full mx-auto flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filtered.length} photos</span>
            <span className="text-amber-400 font-bold">Model Public School Sikta</span>
          </div>
        </div>
      )}
    </section>
  );
});
