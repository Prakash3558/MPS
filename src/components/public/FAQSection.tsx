import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MapPin, Phone, Award, CheckCircle2, GraduationCap, School } from 'lucide-react';
import { useCMS } from '../../context/CMSContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Admissions & Eligibility',
    question: 'How do I apply for admission to Model Public School (MPS Sikta) for session 2026–2027?',
    answer: 'Admissions for the 2026–2027 academic session are currently open from Nursery to Class 10. Parents can register online via the Admissions portal on this website, or visit the school campus accounts desk at Bhawanipur, Sikta, West Champaran. Required documents include the student’s Birth Certificate, Aadhaar Card, previous School Transfer Certificate (TC), and recent passport photographs.'
  },
  {
    category: 'Affiliation & Board',
    question: 'Is Model Public School affiliated with CBSE?',
    answer: 'Yes, Model Public School (MPS Sikta) is a recognized CBSE English Medium educational institution with Affiliation Number 330854 and official UDISE Code 10011503402, adhering strictly to the NCERT curriculum and CBSE assessment frameworks.'
  },
  {
    category: 'Location & Campus',
    question: 'Where is Model Public School located in West Champaran, Bihar?',
    answer: 'The school campus is located at Bhawanipur, Post Office: Kursi Barwa, Sikta, West Champaran, Bihar - 845307. We are easily accessible from Sikta, Mainatand, Narkatiaganj, Bettiah, and surrounding areas in West Champaran with secure school transport/van facilities.'
  },
  {
    category: 'Academics & Labs',
    question: 'What facilities and infrastructure are provided at MPS Sikta?',
    answer: 'MPS Sikta provides state-of-the-art facilities including modern digital Smart Classrooms, well-equipped Composite Science & Physics/Chemistry/Biology Labs, a High-Tech Computer Coding Lab with high-speed internet, an extensive Library with over 5,000+ volumes, a dedicated Sports Ground, clean RO drinking water, 24/7 CCTV security, and electricity backup.'
  },
  {
    category: 'Fees & Payment',
    question: 'What is the fee structure and how can parents pay school fees?',
    answer: 'Model Public School maintains an affordable and transparent fee structure designed for community development. Parents can review the exact class-wise tuition breakdown in our Fee Structure section, pay securely at the school accounts counter, or make payments online with instant computer-generated digital receipts and WhatsApp confirmations.'
  },
  {
    category: 'Parent Portal & Communication',
    question: 'How can parents monitor student attendance, marks, and announcements?',
    answer: 'Parents have 24/7 access to the Model Public School Parent & Student Portal. You can easily view daily subject attendance, download term report cards, check live fee dues, view upcoming homework/exam schedules, and receive automated WhatsApp notifications.'
  }
];

export const FAQSection: React.FC = () => {
  const { settings } = useCMS();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 font-body">
            Common questions regarding admissions, curriculum, transport, and school policies.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-white dark:bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {faq.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? 'bg-amber-500 text-slate-950 rotate-180'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Contact & Admission CTA Card */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-brand-primary/5 to-slate-900/5 dark:from-slate-800 dark:to-slate-850 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
              <School className="w-5 h-5 text-amber-500" /> Have more questions about admissions or campus visits?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Speak directly with our admission counselors or visit our campus at Bhawanipur, Sikta.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+918757968130"
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all"
            >
              <Phone className="w-4 h-4 text-amber-500" /> +91 87579 68130
            </a>
            <a
              href="#admissions"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <GraduationCap className="w-4 h-4" /> Apply for Admission
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
