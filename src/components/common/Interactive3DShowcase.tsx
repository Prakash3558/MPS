import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Compass, ShieldCheck, Cpu, Trophy, Building2,
  ChevronRight, Maximize2, X, CheckCircle2, ArrowUpRight,
  Eye, Layers, Flame, Zap
} from 'lucide-react';

interface Interactive3DCardProps {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  titleHi: string;
  subtitle: string;
  icon: React.ElementType;
  image: string;
  statNumber: string;
  statLabel: string;
  accentGlow: string;
  features: string[];
  onClickInspect: () => void;
}

const TiltCard: React.FC<Interactive3DCardProps> = ({
  badge,
  badgeColor,
  title,
  titleHi,
  subtitle,
  icon: Icon,
  image,
  statNumber,
  statLabel,
  accentGlow,
  features,
  onClickInspect
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12; // tilt angle
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.4 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClickInspect}
      className="relative rounded-3xl p-[1px] transition-transform duration-200 ease-out cursor-pointer group"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 3D Animated Card Container */}
      <div
        className="relative rounded-3xl overflow-hidden bg-slate-900/90 dark:bg-slate-950/90 border border-white/10 dark:border-slate-800 shadow-2xl transition-all duration-300 group-hover:shadow-amber-500/20 group-hover:border-amber-500/40"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        {/* Specular Glare Layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}) 0%, transparent 60%)`,
            mixBlendMode: 'overlay'
          }}
        />

        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-60"
          style={{ backgroundColor: accentGlow }}
        />

        {/* Image Stage with 3D Depth */}
        <div className="relative h-52 sm:h-56 overflow-hidden">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 filter brightness-90 group-hover:brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Floating Pill Badge (Popped forward on Z axis) */}
          <div
            className="absolute top-4 left-4 z-20"
            style={{ transform: 'translateZ(30px)' }}
          >
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg ${badgeColor}`}>
              <Sparkles className="w-3 h-3" />
              {badge}
            </span>
          </div>

          {/* 3D Expand Action Button */}
          <div
            className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ transform: 'translateZ(30px)' }}
          >
            <span className="w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <Maximize2 className="w-4 h-4 text-amber-400" />
            </span>
          </div>

          {/* Floating Highlight Stat in Bottom Corner */}
          <div
            className="absolute bottom-3 right-4 z-20 text-right"
            style={{ transform: 'translateZ(25px)' }}
          >
            <span className="block text-2xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
              {statNumber}
            </span>
            <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              {statLabel}
            </span>
          </div>
        </div>

        {/* Card Content Body with 3D Elevation */}
        <div
          className="p-5 sm:p-6 space-y-3 relative z-10"
          style={{ transform: 'translateZ(20px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-sm">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-heading leading-tight group-hover:text-amber-400 transition-colors">
                {title}
              </h3>
              <p className="text-xs text-amber-400/90 font-medium">
                {titleHi}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
            {subtitle}
          </p>

          {/* Micro Feature Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {features.map((feat, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-0.5 rounded-lg group-hover:border-amber-500/30 transition-colors"
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span className="flex items-center gap-1">
              Explore 3D Interactive Overview
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Interactive3DShowcase: React.FC = () => {
  const [selectedModal, setSelectedModal] = useState<Interactive3DCardProps | null>(null);

  const showcaseCards: Interactive3DCardProps[] = [
    {
      id: 'campus',
      badge: '3D Campus Landmark',
      badgeColor: 'bg-amber-500/90 text-slate-950 border border-amber-400',
      title: 'Digital Smart Classrooms',
      titleHi: 'स्मार्ट क्लासरूम और डिजिटल लैब',
      subtitle: 'Interactive touchscreen boards, high-speed fiber connectivity, and hybrid learning pods for all grades.',
      icon: Building2,
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1200',
      statNumber: '100%',
      statLabel: 'Digital Classrooms',
      accentGlow: '#f59e0b',
      features: ['Interactive Panels', 'CCTV 24/7 Monitored', 'Acoustic Treated'],
      onClickInspect: () => {}
    },
    {
      id: 'stem',
      badge: 'Future Tech & AI',
      badgeColor: 'bg-sky-500/90 text-slate-950 border border-sky-400',
      title: 'STEM & Robotics Lab',
      titleHi: 'रोबोटिक्स और कोडिंग लैब',
      subtitle: 'Hands-on Arduino microcontrollers, 3D printing, python programming, and competitive science olympiad training.',
      icon: Cpu,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200',
      statNumber: '40+',
      statLabel: 'Robotics Kits',
      accentGlow: '#38bdf8',
      features: ['Coding from Class 4', '3D Printer Access', 'Hands-on Physics'],
      onClickInspect: () => {}
    },
    {
      id: 'fleet',
      badge: 'Safety First',
      badgeColor: 'bg-emerald-500/90 text-slate-950 border border-emerald-400',
      title: 'Live GPS Fleet & Safety Shield',
      titleHi: 'लाइव जीपीएस बस ट्रैकिंग और सुरक्षा',
      subtitle: 'Complete transit protection with real-time speed monitoring, student boarding alerts, and geofenced safe stops.',
      icon: ShieldCheck,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200',
      statNumber: '12+',
      statLabel: 'Secure Transit Routes',
      accentGlow: '#10b981',
      features: ['Real-time Parent Radar', 'Verified Drivers', 'Speed Limiter'],
      onClickInspect: () => {}
    },
    {
      id: 'sports',
      badge: 'Champions Arena',
      badgeColor: 'bg-rose-500/90 text-white border border-rose-400',
      title: 'Olympic Athletics & Sports Turf',
      titleHi: 'खेल परिसर और एथलेटिक्स मैदान',
      subtitle: 'Spacious cricket nets, football field, basketball court, badminton, yoga arena, and dedicated athletic coaches.',
      icon: Trophy,
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200',
      statNumber: '2+ Acres',
      statLabel: 'Dedicated Sports Area',
      accentGlow: '#f43f5e',
      features: ['State Medal Winners', 'Annual Sports Meet', 'Taekwondo & Yoga'],
      onClickInspect: () => {}
    }
  ];

  return (
    <section className="relative py-16 sm:py-24 bg-slate-950 text-white overflow-hidden border-t border-b border-slate-800/80">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Interactive 3D Campus Experience</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-tight">
            Designed for 21st Century <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">Excellence</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Hover and move your cursor across the cards to experience real-time 3D parallax depth, specular highlights, and our state-of-the-art campus facilities.
          </p>
        </div>

        {/* 4-Column 3D Perspective Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {showcaseCards.map(card => (
            <TiltCard
              key={card.id}
              {...card}
              onClickInspect={() => setSelectedModal(card)}
            />
          ))}
        </div>

        {/* Quick Link Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center justify-center sm:justify-start gap-2">
              <Flame className="w-5 h-5 text-amber-400" /> Admissions Open for Session 2026–2027
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Classes from Nursery to Class 10th (CBSE Affiliated, Sikta, West Champaran)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#admissions"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-full transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
            >
              <span>Apply Online Now</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="/portal"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-full transition-colors"
            >
              <span>Student Login</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3D Deep Inspection Modal */}
      <AnimatePresence>
        {selectedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl space-y-6"
            >
              {/* Modal Image Header */}
              <div className="relative h-64 sm:h-72">
                <img
                  src={selectedModal.image}
                  alt={selectedModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                <button
                  onClick={() => setSelectedModal(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/80 text-white hover:text-amber-400 flex items-center justify-center border border-white/20 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md mb-2 ${selectedModal.badgeColor}`}>
                    {selectedModal.badge}
                  </span>
                  <h3 className="text-2xl font-black text-white font-heading">
                    {selectedModal.title}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    {selectedModal.titleHi}
                  </p>
                </div>
              </div>

              {/* Modal Content Details */}
              <div className="p-6 pt-0 space-y-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedModal.subtitle}
                </p>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Infrastructure Standards
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                    {selectedModal.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {selectedModal.statNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-bold uppercase">
                      {selectedModal.statLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedModal(null)}
                    className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    Close Overview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
