import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCMS } from '../../context/CMSContext';
import { FacultyMember } from '../../types';
import { EditableText } from '../common/EditableText';
import {
  GraduationCap, BookOpen, Award, Mail, Search, Sparkles, UserCheck, Briefcase, ChevronLeft, ChevronRight, Play, Pause, Filter, ShieldCheck, Eye
} from 'lucide-react';

export const FacultySection: React.FC = React.memo(() => {
  const { settings, loading } = useCMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedMember, setSelectedMember] = useState<FacultyMember | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const facultyList = settings?.faculty || [
    {
      id: 'fac-2',
      name: 'Anjali Verma',
      designation: 'Head of Mathematics (Class 9-12)',
      subject: 'Advanced Mathematics',
      qualification: 'M.Sc. Mathematics, B.Ed. (Gold Medalist)',
      experience: '14+ Years Experience',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
      bio: 'Specialist in Olympiad mathematics and conceptual problem-solving techniques.',
      email: 'anjali.math@modelpublicschool.com'
    },
    {
      id: 'fac-3',
      name: 'Rajesh Kumar Singh',
      designation: 'Senior PGT Chemistry',
      subject: 'Chemistry & Lab Incharge',
      qualification: 'M.Sc. Organic Chemistry, B.Ed.',
      experience: '10+ Years Experience',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      bio: 'Passionate about hands-on experimental chemistry and CBSE board exam coaching.',
      email: 'rajesh.chem@modelpublicschool.com'
    },
    {
      id: 'fac-4',
      name: 'Sunita Devi',
      designation: 'TGT English Literature',
      subject: 'English & Spoken Skills',
      qualification: 'M.A. English, B.Ed.',
      experience: '8+ Years Experience',
      photo: 'https://images.unsplash.com/photo-1580894732413-a704936a33e2?auto=format&fit=crop&q=80&w=600',
      bio: 'Fostering fluent English communication, debate, and creative writing skills.',
      email: 'sunita.eng@modelpublicschool.com'
    },
    {
      id: 'fac-5',
      name: 'Manoj Kumar Jha',
      designation: 'Computer Science Faculty',
      subject: 'Python, Coding & IT',
      qualification: 'M.Tech in CS, B.Ed.',
      experience: '7+ Years Experience',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      bio: 'Guiding students in modern programming, AI fundamentals, and robotics projects.',
      email: 'manoj.cs@modelpublicschool.com'
    }
  ];

  // Extract unique subjects for filter pills
  const subjects = useMemo(() => {
    return ['All', ...Array.from(new Set(facultyList.map(f => f.subject.split('&')[0].trim()).filter(Boolean)))];
  }, [facultyList]);

  const filteredFaculty = useMemo(() => {
    return facultyList.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = selectedSubject === 'All' || f.subject.toLowerCase().includes(selectedSubject.toLowerCase());

      return matchesSearch && matchesSubject;
    });
  }, [facultyList, searchTerm, selectedSubject]);

  // Auto-scroll effect moving horizontally
  useEffect(() => {
    if (!isAutoScrolling || filteredFaculty.length === 0) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoScrolling, filteredFaculty.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="faculty" className="py-20 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden transition-colors text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>Faculty</span>
          </span>

          <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
            <EditableText blockKey="faculty.headline" defaultText="Our Educators" />
          </h2>

          <p className="text-xs sm:text-sm text-slate-400">
            <EditableText
              blockKey="faculty.subtext"
              defaultText="Experienced, compassionate teachers committed to holistic student success."
            />
          </p>
        </div>

        {/* Controls Bar: Search & Subject Filters & Slider Play/Pause */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-md">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teacher, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-700 transition-all"
            />
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Navigation & Auto-play controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`p-2 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                isAutoScrolling
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isAutoScrolling ? "Pause auto-scrolling" : "Start auto-scrolling"}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
              <span className="text-[11px] hidden sm:inline">{isAutoScrolling ? 'Auto-Moving' : 'Paused'}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Moving Scroll Deck */}
        {loading ? (
          <div className="flex items-center gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-6 flex flex-col items-center text-center shadow-lg animate-pulse relative overflow-hidden"
              >
                {/* Decorative top accent skeleton */}
                <div className="absolute top-0 inset-x-0 h-1 bg-slate-800" />

                {/* Circular Photo Skeleton */}
                <div className="relative mb-4 mt-2">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-slate-800 border-2 border-slate-700 shadow-inner flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-700/60" />
                  </div>
                </div>

                {/* Name Skeleton */}
                <div className="h-4 w-3/4 bg-slate-800 rounded-lg mb-2" />

                {/* Designation Skeleton */}
                <div className="h-5 w-1/2 bg-slate-800/60 rounded-full mb-3" />

                {/* Subject Skeleton */}
                <div className="h-3.5 w-2/3 bg-slate-800/80 rounded-md mb-4" />

                {/* Footer/Credentials Skeleton */}
                <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] gap-2">
                  <div className="h-3 w-1/2 bg-slate-800 rounded-sm" />
                  <div className="h-4 w-1/3 bg-slate-800/80 rounded-md" />
                </div>

                {/* CTA Button Skeleton */}
                <div className="mt-4 w-full h-9 bg-slate-800/80 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">No teacher profiles matching your search criteria.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedSubject('All'); }}
              className="mt-3 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Clear filters and view all faculty
            </button>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
            className="flex items-center gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none scroll-smooth snap-x snap-mandatory"
          >
            {filteredFaculty.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="snap-start flex-shrink-0 w-72 bg-slate-900 rounded-2xl border border-slate-800/90 p-5 flex flex-col items-center text-center shadow-sm hover:border-slate-700 hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative overflow-hidden"
              >
                {/* Circular Photo Container */}
                <div className="relative mb-3 mt-1">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-slate-800 border border-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={member.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Name & Class / Designation Info */}
                <h3 className="text-sm sm:text-base font-bold font-heading text-white group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                  {member.name}
                </h3>

                {/* Designation / Class badge */}
                <span className="inline-block bg-slate-800 text-slate-300 border border-slate-700 text-[10.5px] font-medium px-2.5 py-0.5 rounded-full mb-2 max-w-full truncate">
                  {member.designation}
                </span>

                {/* Subject Taught */}
                <p className="text-xs font-normal text-slate-400 flex items-center justify-center gap-1.5 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{member.subject}</span>
                </p>

                {/* Credentials / Experience */}
                <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[130px] font-normal" title={member.qualification}>
                    {member.qualification}
                  </span>
                  {member.experience && (
                    <span className="text-amber-400 font-semibold flex-shrink-0">
                      {member.experience}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl relative space-y-5">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold w-8 h-8 flex items-center justify-center cursor-pointer transition-all"
              >
                ✕
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                {/* Circular Photo in Modal */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-blue-500 to-emerald-400 shadow-xl flex-shrink-0">
                  <img
                    src={selectedMember.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'}
                    alt={selectedMember.name}
                    className="w-full h-full rounded-full object-cover object-top border-2 border-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <span className="inline-block bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedMember.designation}
                  </span>
                  <h3 className="text-xl font-black font-heading text-white">
                    {selectedMember.name}
                  </h3>
                  {selectedMember.experience && (
                    <p className="text-xs text-amber-400 font-bold flex items-center justify-center sm:justify-start gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {selectedMember.experience}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Subject Expertise & Class
                  </span>
                  <p className="font-bold text-white text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" /> {selectedMember.subject}
                    {selectedMember.assignedClasses && (
                      <span className="text-xs font-normal text-slate-400 ml-2">({selectedMember.assignedClasses})</span>
                    )}
                  </p>
                </div>

                <div>
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Academic Qualifications & Experience
                  </span>
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> {selectedMember.qualification}
                    {selectedMember.joiningYear && (
                      <span className="text-[11px] text-amber-400 font-extrabold ml-auto bg-amber-500/10 px-2 py-0.5 rounded">
                        Joined {selectedMember.joiningYear}
                      </span>
                    )}
                  </p>
                </div>

                {selectedMember.achievements && (
                  <div>
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">
                      Honors & Key Achievements
                    </span>
                    <p className="font-semibold text-emerald-300">
                      ★ {selectedMember.achievements}
                    </p>
                  </div>
                )}

                {selectedMember.bio && (
                  <div>
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px] block mb-0.5">
                      Teaching Philosophy & Statement
                    </span>
                    <p className="text-slate-300 leading-relaxed italic">
                      "{selectedMember.bio}"
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMember.email && (
                  <a
                    href={`mailto:${selectedMember.email}`}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" /> Email ({selectedMember.email})
                  </a>
                )}
                {selectedMember.phone && (
                  <a
                    href={`tel:${selectedMember.phone}`}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    📞 Call Teacher ({selectedMember.phone})
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
