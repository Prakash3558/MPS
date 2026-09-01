import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { Card3DTilt } from '../common/Card3DTilt';
import { MapPin, Phone, Mail, Clock, School, ExternalLink, Navigation, Compass } from 'lucide-react';

export const ContactSection: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const [selectedRoute, setSelectedRoute] = useState<'bettiah' | 'raxaul' | 'sikta' | 'motihari'>('bettiah');

  const routeGuides = {
    bettiah: {
      title: 'From Bettiah (District HQ - ~28 km)',
      desc: 'Take the State Highway towards Mainatand / Sikta. Frequent buses and shared autos connect Bettiah directly to Sikta Market / Bhawanipur.',
      time: 'Approx. 45-50 mins'
    },
    raxaul: {
      title: 'From Raxaul / Nepal Border (~22 km)',
      desc: 'Take the Sikta-Raxaul link road via Mainatand. Shared autos and direct buses are frequently available throughout the day.',
      time: 'Approx. 35-40 mins'
    },
    sikta: {
      title: 'From Sikta Railway Station (SKTA - ~2.5 km)',
      desc: 'The school campus at Bhawanipur is just 5 minutes by auto-rickshaw or e-rickshaw from Sikta Railway Station.',
      time: 'Approx. 5-7 mins'
    },
    motihari: {
      title: 'From Motihari (East Champaran - ~65 km)',
      desc: 'Travel via Bettiah or Sugauli-Raxaul highway route. Direct express buses connect Motihari to Bettiah and Sikta.',
      time: 'Approx. 1.5-2 hours'
    }
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/60 px-3.5 py-1 rounded-full inline-block">
            Location & Contact
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            <EditableText blockKey="contact.heading" defaultText="Visit or Contact Us" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <EditableText blockKey="contact.subtext" defaultText="Reach our campus administration for inquiries, admissions, or guided visits." />
          </p>
        </div>

        {/* Clean Single Grid: Left Column Contact Card, Right Column Google Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          {/* Left Column: Contact Card */}
          <div className="lg:col-span-5">
            <Card3DTilt maxTilt={8} scaleOnHover={1.01} className="h-full">
              <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 overflow-hidden p-1">
                      <img
                        src={settings?.logo_url || '/logo.svg'}
                        alt="MPS Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith('/logo.svg')) {
                            target.src = '/logo.svg';
                          }
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg font-heading text-white">
                        {settings?.school_name || 'Model Public School'}
                      </h3>
                      <p className="text-xs text-amber-400 font-bold">CBSE Affiliation No. {settings?.cbse_affiliation || '330854'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-300 font-body">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Campus Address:</strong>
                        <p className="text-slate-400 leading-relaxed">
                          {settings?.address || 'AT- Bhawanipur, P.O.- Kursi Barwa, P.S.- Sikta, West Champaran, Bihar - 845307'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Helpline Phone Numbers:</strong>
                        <p className="text-slate-400">
                          {settings?.phones || '+91 87579 68130, +91 91620 24642'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Official Email:</strong>
                        <p className="text-slate-400">
                          {settings?.email || 'modelpublicschool@gmail.com'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Office Timings:</strong>
                        <p className="text-slate-400">Monday to Saturday: 8:00 AM – 3:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>West Champaran, Bihar</span>
                  <span className="text-amber-400 font-bold">India - 845307</span>
                </div>
              </div>
            </Card3DTilt>
          </div>

          {/* Right Column: Interactive Google Maps Frame */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span>Interactive Campus Location Map</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live GPS
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar - 845307
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('Model Public School Bhawanipur Sikta West Champaran Bihar')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs px-4 py-2 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
              <iframe
                src="https://maps.google.com/maps?q=Model+Public+School+Bhawanipur+Sikta+West+Champaran+Bihar&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
                title="Model Public School Google Maps View"
                className="w-full h-full filter contrast-[1.02]"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Travel & Route Guide */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Campus Travel & Route Guide
                </h3>
                <p className="text-xs text-slate-400">
                  Select your starting point to view directions to our school campus.
                </p>
              </div>
            </div>

            {/* Quick Route Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {(['bettiah', 'raxaul', 'sikta', 'motihari'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedRoute(key)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                    selectedRoute === key
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {key === 'bettiah' && 'From Bettiah'}
                  {key === 'raxaul' && 'From Raxaul'}
                  {key === 'sikta' && 'From Sikta Station'}
                  {key === 'motihari' && 'From Motihari'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-400">
                {routeGuides[selectedRoute].title}
              </h4>
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded-full">
                {routeGuides[selectedRoute].time}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {routeGuides[selectedRoute].desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});


