import React from 'react';
import { motion } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableIcon } from '../common/EditableIcon';
import { Card3DTilt } from '../common/Card3DTilt';
import { Info, ArrowRight } from 'lucide-react';

export const FeesSection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const feeList = settings?.grade_fees || [];

  return (
    <section id="fees" className="py-20 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3 flex flex-col items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full">
            <EditableText blockKey="fee.badge" defaultText="Fee Structure" />
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            <EditableText blockKey="fee.headline" defaultText="Class-wise Fee Structure (2026-27)" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <EditableText blockKey="fee.subtext" defaultText="Affordable, transparent education with flexible monthly fee installment plans." />
          </p>
        </div>

        {/* Modern Fee Table */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider font-heading">
                  <tr>
                    <th className="py-3.5 px-6">Class / Grade</th>
                    <th className="py-3.5 px-6">Admission Fee (One-Time)</th>
                    <th className="py-3.5 px-6">Monthly Tuition Fee</th>
                    <th className="py-3.5 px-6">Annual Development</th>
                    <th className="py-3.5 px-6">Exam & Lab Charges</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-body">
                  {feeList.map((f, idx) => (
                    <tr
                      key={f.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        <EditableText blockKey={`fee.${f.id}.class`} defaultText={f.className} />
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                        ₹<EditableText blockKey={`fee.${f.id}.admission`} defaultText={String(f.admissionFee)} />
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        ₹<EditableText blockKey={`fee.${f.id}.tuition`} defaultText={String(f.monthlyTuition)} /> / mo
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        ₹<EditableText blockKey={`fee.${f.id}.annual`} defaultText={String(f.annualCharges)} />
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        ₹<EditableText blockKey={`fee.${f.id}.exam`} defaultText={String(f.examFee)} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href="#admissions"
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors"
                        >
                          <span><EditableText blockKey="fee.inquireBtn" defaultText="Inquire" /></span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Note Box */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300"
        >
          <EditableIcon iconKey="fee.infoIcon" defaultIcon="Info" defaultColor="#2563eb" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              <EditableText blockKey="fee.policyTitle" defaultText="Fee Payment Policy:" />
            </p>
            <p className="mt-0.5 leading-relaxed">
              <EditableText
                blockKey="fee.policyDesc"
                defaultText="Tuition fees are payable by the 10th of every month. Online fee payment is available via the Student & Parent Portal. Bus transport charges vary based on distance from Bhawanipur, Sikta campus."
                multiline
              />
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default FeesSection;

