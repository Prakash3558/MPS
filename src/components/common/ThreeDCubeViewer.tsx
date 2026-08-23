import React, { useState } from 'react';
import { Award, BookOpen, Cpu, Trophy, Users, ShieldCheck, RotateCcw } from 'lucide-react';

interface FaceData {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
}

const CUBE_FACES: FaceData[] = [
  {
    title: 'CBSE Affiliated',
    subtitle: 'Affiliation No. 330854 (Code: 65851)',
    icon: <Award className="w-8 h-8 text-amber-400" />,
    color: 'from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/50',
    badge: 'National Standard'
  },
  {
    title: 'Modern Science Labs',
    subtitle: 'Physics, Chemistry & Bio Experimentation',
    icon: <Cpu className="w-8 h-8 text-blue-400" />,
    color: 'from-blue-500/20 via-slate-900 to-slate-950 border-blue-500/50',
    badge: 'Practical Learning'
  },
  {
    title: 'Digital Smart Classrooms',
    subtitle: 'Interactive displays & multimedia learning',
    icon: <BookOpen className="w-8 h-8 text-emerald-400" />,
    color: 'from-emerald-500/20 via-slate-900 to-slate-950 border-emerald-500/50',
    badge: 'Tech Integration'
  },
  {
    title: 'Sports & Athletics Arena',
    subtitle: 'Football, Cricket, Badminton & Indoor games',
    icon: <Trophy className="w-8 h-8 text-purple-400" />,
    color: 'from-purple-500/20 via-slate-900 to-slate-950 border-purple-500/50',
    badge: 'Physical Excellence'
  },
  {
    title: 'Expert Faculty Team',
    subtitle: 'Dedicated, experienced & trained educators',
    icon: <Users className="w-8 h-8 text-rose-400" />,
    color: 'from-rose-500/20 via-slate-900 to-slate-950 border-rose-500/50',
    badge: 'Top Educators'
  },
  {
    title: 'Safe & Secure Campus',
    subtitle: '24/7 CCTV monitoring & bus transport',
    icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
    color: 'from-cyan-500/20 via-slate-900 to-slate-950 border-cyan-500/50',
    badge: 'Safety First'
  }
];

export const ThreeDCubeViewer: React.FC = React.memo(() => {
  const [rotX, setRotX] = useState(-18);
  const [rotY, setRotY] = useState(-25);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotate(false);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPos.x;
    const deltaY = e.clientY - lastPos.y;

    setRotY(prev => prev + deltaX * 0.6);
    setRotX(prev => prev - deltaY * 0.6);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setRotX(-18);
    setRotY(-25);
    setIsAutoRotate(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Header controls */}
      <div className="w-full flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span>Interactive 3D Highlights Cube</span>
        </div>

        <button
          onClick={resetRotation}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
          title="Reset Cube View"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset 3D Spin
        </button>
      </div>

      {/* 3D Cube Perspective Container */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center cursor-grab active:cursor-grabbing my-4 select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className={`relative w-56 h-56 sm:w-64 sm:h-64 preserve-3d transition-transform ${
            isAutoRotate ? 'animate-spin-3d-slow' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isAutoRotate ? undefined : `rotateX(${rotX}deg) rotateY(${rotY}deg)`
          }}
        >
          {/* FACE 1: FRONT */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[0].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[0].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {CUBE_FACES[0].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[0].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[0].subtitle}</p>
            </div>
          </div>

          {/* FACE 2: BACK */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[1].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'rotateY(180deg) translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[1].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {CUBE_FACES[1].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[1].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[1].subtitle}</p>
            </div>
          </div>

          {/* FACE 3: RIGHT */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[2].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'rotateY(90deg) translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[2].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {CUBE_FACES[2].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[2].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[2].subtitle}</p>
            </div>
          </div>

          {/* FACE 4: LEFT */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[3].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'rotateY(-90deg) translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[3].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {CUBE_FACES[3].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[3].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[3].subtitle}</p>
            </div>
          </div>

          {/* FACE 5: TOP */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[4].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'rotateX(90deg) translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[4].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {CUBE_FACES[4].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[4].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[4].subtitle}</p>
            </div>
          </div>

          {/* FACE 6: BOTTOM */}
          <div
            className={`absolute inset-0 p-6 rounded-3xl bg-gradient-to-br ${CUBE_FACES[5].color} border-2 flex flex-col justify-between backdrop-blur-md shadow-2xl text-white`}
            style={{ transform: 'rotateX(-90deg) translateZ(112px)' }}
          >
            <div className="flex items-center justify-between">
              {CUBE_FACES[5].icon}
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {CUBE_FACES[5].badge}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading">{CUBE_FACES[5].title}</h4>
              <p className="text-xs text-slate-300 mt-1">{CUBE_FACES[5].subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 font-medium">
        ✨ Drag cube with mouse/finger to explore all 6 school features in 3D
      </p>
    </div>
  );
});
