import React, { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { ChevronLeft, ChevronRight, Bookmark, Download, Smartphone, GraduationCap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ThreeDHeroCanvas } from '../common/ThreeDHeroCanvas';
import { AppDownloadModal } from '../common/AppDownloadModal';

export const HeroSection: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const slides = settings?.hero_slides || [];
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // If a custom video URL is provided in admin settings, use video mode; otherwise smooth slide images
  const hasCustomVideo = Boolean(settings?.hero_video_url && settings.hero_video_url.trim() !== '');
  const bgVideoUrl = settings?.hero_video_url;

  // Smooth automatic slide transition for image background
  useEffect(() => {
    if (hasCustomVideo || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasCustomVideo, slides.length]);

  const safeIndex = currentSlideIndex < slides.length ? currentSlideIndex : 0;

  const currentSlide = slides[safeIndex] || {
    title: 'Model Public School',
    subtitle: 'Nurturing excellence in academics & character since 2000',
    badge: `CBSE Affiliated · ${settings?.cbse_affiliation || '330854'}`,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600'
  };

  const handleUpdateSlideImage = (newUrl: string, slideIndex: number) => {
    if (!settings || !settings.hero_slides) return;
    const updatedSlides = [...settings.hero_slides];
    if (updatedSlides[slideIndex]) {
      updatedSlides[slideIndex].image = newUrl;
      updateSettings({ hero_slides: updatedSlides });
    }
  };

  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative text-white overflow-hidden min-h-[620px] sm:min-h-[680px] lg:min-h-[720px] flex flex-col justify-between items-center bg-slate-950">
      {/* BACKGROUND MEDIA: SEAMLESS IMAGE-TO-IMAGE FADE (NO BLACK/WHITE GAP) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        {hasCustomVideo ? (
          <div className="relative w-full h-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              key={bgVideoUrl}
              className="w-full h-full object-cover scale-105 opacity-80 filter brightness-95 transition-all duration-1000"
            >
              <source src={bgVideoUrl} type="video/mp4" />
            </video>
          </div>
        ) : (
          /* Stacked Absolute Image Layers for Seamless Image-to-Image Fade */
          <div className="relative w-full h-full">
            {slides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              const isFirstSlide = idx === 0;
              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 ${isFirstSlide && currentSlideIndex === 0 ? '' : 'transition-opacity duration-1000 ease-in-out'} ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut'
                    }}
                    className="w-full h-full"
                  >
                    <EditableImage
                      src={slide.image}
                      alt={`MPS Sikta Banner ${idx + 1}`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover filter brightness-90 contrast-105"
                      onSaveImage={(newUrl) => handleUpdateSlideImage(newUrl, idx)}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* Soft Contrast Scrim Overlay - Minimal & Translucent so image is vivid */}
        <div className="absolute inset-0 z-15 bg-slate-950/25 pointer-events-none"></div>
        <div className="absolute inset-0 z-15 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none"></div>
        
        {/* Interactive 3D WebGL Floating Geometry & Stars Overlay */}
        <ThreeDHeroCanvas />
      </div>

      {/* FLOATING SIDE NAVIGATION ARROWS */}
      {!hasCustomVideo && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/25 hover:bg-black/45 active:scale-95 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all shadow-lg cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/25 hover:bg-black/45 active:scale-95 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all shadow-lg cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* CENTERED MINIMAL HERO CONTENT CONTAINER */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 pt-16 sm:pt-20 pb-12 flex-grow flex flex-col justify-center items-center text-center w-full space-y-6">
        
        {/* Top Minimal Badge Pill */}
        <div
          key={`badge-${currentSlideIndex}`}
          className="inline-flex items-center gap-2 bg-black/40 border border-white/20 text-white font-medium text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-sm backdrop-blur-md"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <EditableText
            blockKey={`hero.slide.${currentSlideIndex}.badge`}
            defaultText={currentSlide.badge || `CBSE Affiliated · ${settings?.cbse_affiliation || '330854'}`}
          />
        </div>

        {/* Main Display Headline */}
        <div className="space-y-3 max-w-3xl">
          <h1
            key={`title-${currentSlideIndex}`}
            className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white leading-[1.1] drop-shadow-md"
          >
            <EditableText
              blockKey={`hero.slide.${currentSlideIndex}.title`}
              defaultText={currentSlide.title || 'Model Public School'}
              multiline
            />
          </h1>

          {/* Subtitle */}
          <div
            key={`sub-${currentSlideIndex}`}
            className="text-base sm:text-lg text-white/85 leading-relaxed font-sans max-w-xl mx-auto font-normal drop-shadow-sm"
          >
            <EditableText
              blockKey={`hero.slide.${currentSlideIndex}.subtitle`}
              defaultText={currentSlide.subtitle || 'Nurturing excellence in academics & character since 2000'}
              multiline
            />
          </div>
        </div>

        {/* MINIMAL & CLEAN ACTION HIERARCHY */}
        <div className="pt-2 flex flex-col items-center gap-3 w-full max-w-md">
          {/* 1. PRIMARY FOCUS: Apply for Admission */}
          <a
            href="#admissions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm sm:text-base py-3 px-8 rounded-full shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Apply for Admission 2026-27</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </a>

          {/* 2. SECONDARY FOCUS: Student & Parent Portal + Download App */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <a
              href="/portal"
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-full shadow-sm backdrop-blur-md transition-all"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Student Portal</span>
            </a>

            <button
              type="button"
              onClick={() => setDownloadModalOpen(true)}
              className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-full shadow-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Download App</span>
            </button>
          </div>

          {/* 3. LEAST FOCUS: Explore Campus & Facilities */}
          <a
            href="#facilities"
            className="text-xs text-white/70 hover:text-white font-medium hover:underline underline-offset-4 transition-colors pt-1 inline-flex items-center gap-1"
          >
            <span>Explore Campus & Facilities</span>
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

      {/* BOTTOM SLIDE DOTS / INDICATOR (Matches screenshot bottom indicators) */}
      {!hasCustomVideo && slides.length > 1 && (
        <div className="relative z-20 pb-6 flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                idx === currentSlideIndex
                  ? 'bg-white w-10 shadow-lg'
                  : 'bg-white/40 w-2.5 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
});
