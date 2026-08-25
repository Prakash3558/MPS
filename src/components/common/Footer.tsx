import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from './EditableText';
import { Phone, Mail, MapPin, School, ShieldCheck, Download, Smartphone } from 'lucide-react';
import { LegalPagesModal, LegalTab } from './LegalPagesModal';
import { AppDownloadModal } from './AppDownloadModal';

export const Footer: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<LegalTab>('privacy');

  const openLegalTab = (tab: LegalTab) => {
    setActiveLegalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs py-12 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 max-w-[140px] rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold overflow-hidden p-1 shadow-sm border border-slate-200 dark:border-slate-800 flex-shrink-0">
              <img
                src={settings?.logo_url || '/logo.svg'}
                alt={settings?.school_name ? `${settings.school_name} Logo` : 'MPS School Logo'}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full w-auto h-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/logo.svg')) {
                    target.src = '/logo.svg';
                  }
                }}
              />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
              <EditableText blockKey="footer.schoolName" defaultText={settings?.school_name || 'Model Public School'} />
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-body">
            <EditableText blockKey="footer.tagline" defaultText="Empowering students with academic excellence, digital skills, and moral character in Sikta, West Champaran." />
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-medium px-3 py-0.5 rounded-full">
              CBSE: {settings?.cbse_affiliation || '330854'}
            </span>
            <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-medium px-3 py-0.5 rounded-full">
              UDISE: {settings?.udise_code || '10011503402'}
            </span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-2 font-medium">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Quick Links</h4>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li><a href="#about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About Us</a></li>
            <li><a href="#facilities" className="hover:text-slate-900 dark:hover:text-white transition-colors">Campus & Facilities</a></li>
            <li><a href="#gallery" className="hover:text-slate-900 dark:hover:text-white transition-colors">Photo Gallery</a></li>
            <li><a href="#fees" className="hover:text-slate-900 dark:hover:text-white transition-colors">Fee Structure</a></li>
            <li><a href="#admissions" className="hover:text-slate-900 dark:hover:text-white transition-colors">Admissions 2026</a></li>
            <li><a href="#contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-2 font-medium">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Portals & Apps</h4>
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => setDownloadModalOpen(true)}
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-amber-500 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Download Official App</span>
              </button>
            </li>
            <li><a href="/portal" className="hover:text-slate-900 dark:hover:text-white transition-colors text-slate-900 dark:text-white font-semibold">Student & Parent Portal</a></li>
            <li><a href="/teacher" className="hover:text-slate-900 dark:hover:text-white transition-colors text-slate-600 dark:text-slate-400">Teacher Workspace</a></li>
            <li><a href="/admin" className="hover:text-slate-900 dark:hover:text-white transition-colors text-slate-600 dark:text-slate-400">Admin Control Center</a></li>
            <li className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => openLegalTab('disclosures')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline font-medium flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> CBSE Mandatory Disclosure
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-2 font-body">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Contact Information</h4>
          <p className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>{settings?.address || 'AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, Bihar - 845307'}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>{settings?.phones || '+91 87579 68130, +91 91620 24642'}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>{settings?.email || 'modelpublicschool@gmail.com'}</span>
          </p>
        </div>
      </div>

      {/* Compliance & Legal Footer Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3 font-medium">
          <button type="button" onClick={() => openLegalTab('privacy')} className="hover:text-slate-900 dark:hover:text-white hover:underline">
            Privacy Policy
          </button>
          <span>•</span>
          <button type="button" onClick={() => openLegalTab('terms')} className="hover:text-slate-900 dark:hover:text-white hover:underline">
            Terms of Use
          </button>
          <span>•</span>
          <button type="button" onClick={() => openLegalTab('refund')} className="hover:text-slate-900 dark:hover:text-white hover:underline">
            Fee & Refund Policy
          </button>
          <span>•</span>
          <button type="button" onClick={() => openLegalTab('disclosures')} className="hover:text-slate-900 dark:hover:text-white hover:underline">
            CBSE Disclosure
          </button>
          <span>•</span>
          <button type="button" onClick={() => openLegalTab('disclaimer')} className="hover:text-slate-900 dark:hover:text-white hover:underline">
            Disclaimer
          </button>
        </div>

        <div className="text-right">
          <p>© {new Date().getFullYear()} Model Public School (MPS Sikta). All rights reserved.</p>
          <p className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">Developed By Prakash Sah (2026)</p>
        </div>
      </div>

      {/* Legal Modal Component */}
      <LegalPagesModal
        isOpen={legalModalOpen}
        initialTab={activeLegalTab}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />
    </footer>
  );
});
