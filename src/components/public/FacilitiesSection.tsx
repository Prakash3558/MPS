import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { Card3DTilt } from '../common/Card3DTilt';
import { Facility } from '../../types';
import {
  Monitor, FlaskConical, Cpu, Bus, BookOpen, Trophy, ShieldCheck, Wifi, Music, Activity, HeartPulse, Sparkles, X, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';

export const FacilitiesSection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const facilities = settings?.facilities || [];
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Interactive Auto-Moving Engine with Full Vertical Page Scrolling & Horizontal Swiping
  const trackRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const preciseScrollPosRef = useRef<number>(0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Monitor': return <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Bus': return <Bus className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-rose-500" />;
      case 'Wifi': return <Wifi className="w-5 h-5 text-cyan-500" />;
      case 'Music': return <Music className="w-5 h-5 text-purple-500" />;
      case 'Activity': return <Activity className="w-5 h-5 text-lime-500" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-red-500" />;
      default: return <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  // Duplicate items 3 times for continuous seamless scrolling loop
  const loopList = facilities.length > 0
    ? [...facilities, ...facilities, ...facilities]
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
    if (!el || facilities.length === 0) return;

    let animId: number;
    let lastTime: number | null = null;
    preciseScrollPosRef.current = el.scrollLeft;
    const pixelsPerSecond = 32; // Calibrated speed for comfortable viewing & reading

    const animate = (currentTime: number) => {
      if (lastTime === null) {
        lastTime = currentTime;
      }
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // clamp to avoid huge jumps
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
  }, [facilities.length]);

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

  // Mouse Drag handlers for desktop
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

  const handleCardClick = (facility: Facility) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setSelectedFacility(facility);
  };

  return (
    <section id="facilities" className="py-14 sm:py-18 bg-white dark:bg-slate-950 transition-colors relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full inline-block">
              Facilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
              <EditableText blockKey="facilities.heading" defaultText="Campus & Facilities" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Modern environments crafted for holistic student growth and academic exploration.
            </p>
          </div>

          {/* Quick Prev / Next Navigation Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => handleManualNav('left')}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll facilities left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleManualNav('right')}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll facilities right"
            >
              <ChevronRight className="w-4 h-4" />
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
          {loopList.map((f, idx) => (
            <div
              key={`facility-${f.id}-${idx}`}
              onClick={() => handleCardClick(f)}
              className="w-[85vw] max-w-[360px] sm:w-[380px] md:w-[400px] flex-shrink-0 cursor-pointer"
            >
              <Card3DTilt maxTilt={4} scaleOnHover={1.02} className="h-full">
                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full group relative">
                  
                  {/* Category & Status Badges */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                    {f.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                        {f.category}
                      </span>
                    )}
                  </div>

                  {/* Photo Container */}
                  <div className="aspect-[16/10] overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <EditableImage
                      src={f.image}
                      alt={f.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-grow space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0">
                          {getIcon(f.iconName)}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading line-clamp-1">
                          <EditableText blockKey={`facility.${f.id}.title`} defaultText={f.title} />
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-body line-clamp-2">
                        <EditableText blockKey={`facility.${f.id}.desc`} defaultText={f.description} />
                      </p>
                    </div>

                    <div className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Card3DTilt>
            </div>
          ))}
        </div>

        {/* Facility Details Modal */}
        <AnimatePresence>
          {selectedFacility && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedFacility(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    {getIcon(selectedFacility.iconName)}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                      {selectedFacility.category || 'Campus Facility'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
                      {selectedFacility.title}
                    </h3>
                  </div>
                </div>

                <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                  <img src={selectedFacility.image} alt={selectedFacility.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Overview & Equipment Specifications</h4>
                  <p>{selectedFacility.overview || selectedFacility.description}</p>
                </div>

                {selectedFacility.highlights && selectedFacility.highlights.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Key Highlights</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedFacility.highlights.map((hl, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
