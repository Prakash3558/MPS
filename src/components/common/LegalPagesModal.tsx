import React, { useState } from 'react';
import { Shield, FileText, AlertCircle, BookOpen, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

export type LegalTab = 'privacy' | 'terms' | 'disclosures' | 'refund' | 'disclaimer';

interface LegalPagesModalProps {
  initialTab?: LegalTab;
  isOpen: boolean;
  onClose: () => void;
}

export const LegalPagesModal: React.FC<LegalPagesModalProps> = ({ initialTab = 'privacy', isOpen, onClose }) => {
  const { settings } = useCMS();
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {settings?.school_name || 'Model Public School'} • Institutional & Legal Disclosures
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CBSE Affiliation No: {settings?.cbse_affiliation || '330854'} | Sikta, West Champaran, Bihar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Privacy Policy
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms & Conditions
          </button>

          <button
            onClick={() => setActiveTab('disclosures')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'disclosures'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Mandatory CBSE Disclosure
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Fee & Refund Policy
          </button>

          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'disclaimer'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Disclaimer
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" /> Privacy Policy & Data Protection
              </h4>
              <p>
                <strong>Last Updated: August 2026</strong> • Model Public School (MPS Sikta), located at Bhawanipur, Sikta, West Champaran, Bihar - 845307, respects your privacy and is committed to protecting student, parent, and visitor personal information.
              </p>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">1. Information We Collect</h5>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>Student Information:</strong> Name, Date of Birth, Roll No, Class, Academic grades, and attendance records.</li>
                  <li><strong>Parent/Guardian Information:</strong> Contact numbers, Email address, and residential postal details for emergency communications and fee notifications.</li>
                  <li><strong>Technical Usage:</strong> Browser IP, device type, and session cookies solely to enhance portal navigation security and accessibility.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">2. How Information is Used</h5>
                <p>Personal information is utilized strictly for academic administration, online admissions evaluation, fee collection receipts, issuing report cards, and automated WhatsApp/SMS parent notifications. We never sell or lease student data to third parties.</p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">3. Third-Party Advertising & Cookies (Google AdSense)</h5>
                <p>This website may display family-safe academic and educational advertisements through Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on user visits. Users may opt out of personalized advertising by visiting Google Ad Settings.</p>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">4. Contact Privacy Officer</h5>
                <p>For data inquiries or corrections, please contact: <strong>modelpublicschool@gmail.com</strong> or call <strong>+91 87579 68130</strong>.</p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS AND CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Website Terms & Conditions of Use
              </h4>
              <p>
                By accessing <strong>Model Public School (MPS Sikta)</strong> online portal and website, you agree to comply with school codes of conduct and digital guidelines.
              </p>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">1. Academic Portal Usage</h5>
                <p>The student and teacher portals are designated solely for authorized enrolled pupils, parents, and faculty members. Unauthorized access attempts, password sharing, or tampering with database records are strictly prohibited.</p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">2. Intellectual Property</h5>
                <p>All school insignia, syllabus material, custom questions, exam results formats, and website graphics are the intellectual property of Model Public School, Sikta.</p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white">3. Online Admissions</h5>
                <p>Submitting an admission inquiry form does not guarantee admission. Admissions are subject to seat availability, document verification (Transfer Certificate, Birth Certificate, Aadhaar), and administrative approval.</p>
              </div>
            </div>
          )}

          {/* TAB 3: MANDATORY CBSE DISCLOSURE */}
          {activeTab === 'disclosures' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" /> CBSE Mandatory Disclosure & Institutional Transparency
              </h4>
              <p>In accordance with CBSE (Central Board of Secondary Education) regulatory norms, the following institutional parameters are publicly disclosed:</p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white w-1/3">School Name</td>
                      <td className="p-3">{settings?.school_name || 'Model Public School'} (MPS Sikta)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Affiliation Number</td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{settings?.cbse_affiliation || '330854'}</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">UDISE Code</td>
                      <td className="p-3 font-mono font-bold">{settings?.udise_code || '10011503402'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Campus Location</td>
                      <td className="p-3">{settings?.address || 'AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar - 845307'}</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Principal</td>
                      <td className="p-3">{settings?.principal_name || 'Principal'}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">Official Contact</td>
                      <td className="p-3">{settings?.phones || '+91 8757968130, +91 9162024642'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FEE & REFUND POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500" /> Fee Collection, Dues & Refund Policy
              </h4>
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p>1. <strong>Payment Cycle:</strong> Monthly tuition fees must be cleared on or before the 15th of each academic month at the school accounts counter or via official digital channels.</p>
                <p>2. <strong>Official Receipts:</strong> Every fee transaction is acknowledged with an authorized computer-generated official receipt stamped with the school seal and unique receipt number.</p>
                <p>3. <strong>Refund Policy:</strong> Admission and registration fees are non-refundable. Monthly tuition fees paid in advance may be adjusted or refunded pro-rata upon verified Transfer Certificate processing in accordance with CBSE bylaws.</p>
                <p>4. <strong>Parent Alerts:</strong> Automated WhatsApp fee reminders are dispatched to registered parent phone numbers for pending dues.</p>
              </div>
            </div>
          )}

          {/* TAB 5: DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> General Institutional Disclaimer
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p>
                  The information provided on this website is for general educational and institutional guidance. While Model Public School strives to keep all curriculum, fee registers, event notices, and examination dates current and accurate, any official announcements on the physical school notice board or official circulars signed by the Principal take precedence.
                </p>
                <p>
                  External links (such as Google Maps directions or educational reference portals) are provided for convenience, and the school is not responsible for third-party content.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-500">Model Public School • Sikta, West Champaran</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-sm"
          >
            Close Disclosures
          </button>
        </div>

      </div>
    </div>
  );
};
