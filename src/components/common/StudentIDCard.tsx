import React from 'react';
import { Student, SiteSettings } from '../../types';
import { useCMS } from '../../context/CMSContext';
import { Download, ShieldCheck, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { downloadElementAsPDF, downloadElementAsImage } from '../../lib/pdf';

interface StudentIDCardProps {
  student: Student;
  settings?: SiteSettings;
}

export const StudentIDCard: React.FC<StudentIDCardProps> = ({ student, settings: propSettings }) => {
  const { settings: contextSettings } = useCMS();
  const settings = propSettings || contextSettings;

  const handleDownloadPDF = () => {
    downloadElementAsPDF(`student-id-card-${student.id}`, `ID_Card_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadImage = () => {
    downloadElementAsImage(`student-id-card-${student.id}`, `ID_Card_${student.name.replace(/\s+/g, '_')}.png`);
  };

  return (
    <div className="flex flex-col items-center gap-4 my-2">
      <div
        id={`student-id-card-${student.id}`}
        className="w-full max-w-sm bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border-2 border-amber-400/80 relative overflow-hidden"
      >
        {/* Background Decorative Pattern */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>

        {/* Top Header */}
        <div className="text-center border-b border-amber-400/30 pb-3 mb-4 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="School Logo" className="max-h-8 max-w-[120px] w-auto h-auto object-contain flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            )}
            <h2 className="text-base font-extrabold tracking-wide uppercase text-amber-300">
              {settings?.school_name || 'Model Public School'}
            </h2>
          </div>
          <p className="text-[11px] text-slate-300">
            Affiliated to CBSE, New Delhi | Affiliation No: {settings?.cbse_affiliation || '330854'}
          </p>
          <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full mt-1">
            STUDENT IDENTITY CARD
          </span>
        </div>

        {/* Card Body */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-800">
              <img
                src={student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow">
              100% VERIFIED
            </div>
          </div>

          {/* Details */}
          <div className="flex-grow text-center sm:text-left space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{student.name}</h3>
            <div className="inline-flex gap-2 text-xs font-semibold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">
              <span>Class: {student.class}</span>
              <span>•</span>
              <span>Sec: {student.section}</span>
              <span>•</span>
              <span>Roll: {student.rollNo}</span>
            </div>

            <div className="text-xs text-slate-300 pt-2 space-y-1">
              <p className="flex items-center justify-center sm:justify-start gap-1">
                <span className="font-semibold text-slate-400">Parent:</span> {student.parentName}
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-1">
                <Phone className="w-3 h-3 text-amber-400" /> {student.phone}
              </p>
              <p className="flex items-center justify-center sm:justify-start gap-1 text-[11px] leading-tight text-slate-300">
                <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate max-w-[180px]">{student.address}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card Footer with Signatures & Seal */}
        <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-end justify-between text-[10px] text-slate-400 relative z-10">
          <div>
            <p className="flex items-center gap-1 font-medium text-slate-300">
              <Calendar className="w-3 h-3 text-amber-400" /> Adm Date: {student.admissionDate}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">Bhawanipur, Sikta, Bihar</p>
          </div>

          <div className="text-center">
            <div className="font-serif italic text-amber-300 text-xs font-bold leading-none mb-1">
              {settings?.principal_name || 'Mr. Waseem Aalam'}
            </div>
            <div className="border-t border-amber-400/50 pt-0.5 font-sans uppercase text-[8px] tracking-wider text-slate-300">
              Principal Stamp
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF ID Card
        </button>
        <button
          onClick={handleDownloadImage}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs px-4 py-2 rounded-xl shadow transition-colors"
        >
          <Award className="w-4 h-4" /> Download Image
        </button>
      </div>
    </div>
  );
};
