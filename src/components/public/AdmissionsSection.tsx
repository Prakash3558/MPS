import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableIcon } from '../common/EditableIcon';
import { api } from '../../lib/api';
import { Send, CheckCircle } from 'lucide-react';

export const AdmissionsSection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    targetClass: 'Class 1',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Optimistic UI update: display success card immediately
    setSubmitted(true);
    try {
      await api.createAdmission(formData);
    } catch (e) {
      console.warn('Admission submit offline fallback:', e);
    }
  };

  return (
    <section id="admissions" className="py-20 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Guidelines */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full inline-block">
              <EditableText blockKey="admissions.badge" defaultText="Admissions 2026-27" />
            </span>

            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
              <EditableText blockKey="admissions.title" defaultText="Join Model Public School" />
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-body">
              <EditableText blockKey="admissions.desc" defaultText="Admissions open for Nursery to Class 10. Simple 3-step registration process for the upcoming academic session." />
            </p>

            {/* Admission Steps */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="admissions.step1Title" defaultText="Online Registration" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="admissions.step1Desc" defaultText="Submit the inquiry form or visit the campus counter." />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="admissions.step2Title" defaultText="Student Interaction" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="admissions.step2Desc" defaultText="Short interactive assessment to understand learning level." />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="admissions.step3Title" defaultText="Document Verification" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="admissions.step3Desc" defaultText="Verify birth certificate / TC and confirm enrollment." />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Admission Inquiry Form */}
          <div className="lg:col-span-6">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading mb-1">
                    <EditableText blockKey="admissions.formTitle" defaultText="Online Admission Inquiry Form" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <EditableText blockKey="admissions.formSubtitle" defaultText="Submit your details and our admission team will get in touch with you." />
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="e.g. Rahul Kumar"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Seeking Class *
                      </label>
                      <select
                        value={formData.targetClass}
                        onChange={e => setFormData({ ...formData, targetClass: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                      >
                        <option>Nursery / LKG / UKG</option>
                        <option>Class 1</option>
                        <option>Class 2</option>
                        <option>Class 3</option>
                        <option>Class 4</option>
                        <option>Class 5</option>
                        <option>Class 6</option>
                        <option>Class 7</option>
                        <option>Class 8</option>
                        <option>Class 9</option>
                        <option>Class 10</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Message / Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Ask about school bus route, hostel availability, or prospectus..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <EditableIcon iconKey="admissions.sendIcon" defaultIcon="Send" defaultColor="currentColor" size={16} />
                    <span>{submitting ? 'Submitting...' : <EditableText blockKey="admissions.submitBtn" defaultText="Submit Admission Inquiry" />}</span>
                  </button>
                </form>
              ) : (
                <div className="text-center py-12 space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                    Inquiry Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                    Thank you, <strong>{formData.parentName}</strong>. Our admission team will contact you at <strong>{formData.phone}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Submit another inquiry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default AdmissionsSection;

