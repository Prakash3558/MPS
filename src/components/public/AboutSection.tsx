import React from 'react';
import { motion } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { EditableIcon } from '../common/EditableIcon';
import { Card3DTilt } from '../common/Card3DTilt';
import { Quote } from 'lucide-react';

export const AboutSection: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();

  const handleUpdatePrincipalPhoto = (newUrl: string) => {
    updateSettings({ principal_photo: newUrl });
  };

  return (
    <section id="about" className="py-20 bg-slate-50 dark:bg-slate-900/60 transition-colors relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 flex flex-col items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full">
            Our Foundation
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            <EditableText blockKey="about.title" defaultText="About Model Public School" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Affiliated to CBSE, New Delhi · Affiliation No: {settings?.cbse_affiliation || '330854'}
          </p>
        </div>

        {/* Grid 2 Column: Institution Overview & Director's Desk */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Details & Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed font-body">
              <EditableText
                blockKey="about.text1"
                defaultText="Model Public School, located at Bhawanipur, Sikta, is an esteemed CBSE-affiliated co-educational institution committed to academic brilliance, technological literacy, and strong ethical values."
                multiline
                as="p"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              />
              <EditableText
                blockKey="about.text2"
                defaultText="We offer comprehensive learning programs from Primary through Higher Secondary, equipped with digital smart boards, science and computer labs, expansive athletic fields, and safe bus transport across West Champaran."
                multiline
                as="p"
                className="text-sm sm:text-base text-slate-600 dark:text-slate-300"
              />
            </div>

            {/* Key Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800">
                <EditableIcon iconKey="about.p1.icon" defaultIcon="CheckCircle2" defaultColor="#10b981" className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="about.p1.title" defaultText="CBSE Curriculum" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="about.p1.desc" defaultText="NCERT mapped learning with regular unit tests & lab exposure." />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800">
                <EditableIcon iconKey="about.p2.icon" defaultIcon="Heart" defaultColor="#10b981" className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="about.p2.title" defaultText="Individual Care" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="about.p2.desc" defaultText="Low student-teacher ratio to support every learner's potential." />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800">
                <EditableIcon iconKey="about.p3.icon" defaultIcon="Laptop" defaultColor="#10b981" className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="about.p3.title" defaultText="Digital Classrooms" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="about.p3.desc" defaultText="Interactive panels, AI computer lab, and audiovisual lessons." />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800">
                <EditableIcon iconKey="about.p4.icon" defaultIcon="Bus" defaultColor="#10b981" className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    <EditableText blockKey="about.p4.title" defaultText="Safe Bus Fleet" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <EditableText blockKey="about.p4.desc" defaultText="Transport covering Sikta, Bhawanipur, and Kursi Barwa." />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Director's Card (3D Tilt Card) */}
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="lg:col-span-5"
          >
            <Card3DTilt maxTilt={10} scaleOnHover={1.02}>
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden space-y-6">
                <Quote className="absolute right-4 top-4 w-20 h-20 text-slate-100 dark:text-slate-800 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <EditableImage
                        src={settings?.principal_photo || 'https://neakvyuddcftatlpabmf.supabase.co/storage/v1/object/public/school-uploads/uploads/general/1786700123090_WhatsApp-Image-2026-.png'}
                        alt="Director Photo"
                        className="w-full h-full object-cover"
                        onSaveImage={handleUpdatePrincipalPhoto}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        Director's Desk
                      </span>
                      <h3 className="text-lg font-bold mt-1 font-heading text-slate-900 dark:text-white">
                        <EditableText
                          blockKey="about.principalName"
                          defaultText={settings?.principal_name || 'Mr. Waseem Aalam'}
                        />
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Model Public School (MPS Sikta)</p>
                    </div>
                  </div>

                  <div className="relative text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-body italic bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    "<EditableText
                      blockKey="about.principalMessage"
                      defaultText={settings?.principal_message || 'Welcome to Model Public School, Sikta. We are committed to fostering academic excellence, moral integrity, and holistic development in every child.'}
                      multiline
                    />"
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>AT- Bhawanipur, Sikta, Bihar</span>
                    <span className="text-blue-700 dark:text-blue-400 font-bold">CBSE No. {settings?.cbse_affiliation || '330854'}</span>
                  </div>
                </div>
              </div>
            </Card3DTilt>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
