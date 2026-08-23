import React, { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import {
  Download, Smartphone, Apple, Monitor, QrCode, CheckCircle2,
  ExternalLink, X, Sparkles, ArrowRight, ShieldCheck, Share2, PlusSquare
} from 'lucide-react';
import { promptInstallApp, subscribeInstallPrompt, getDeviceOS, downloadWebAppLauncher } from '../../lib/pwa';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useCMS();
  const [canInstall, setCanInstall] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installStatus, setInstallStatus] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeInstallPrompt((available) => {
      setCanInstall(available);
    });
    const device = getDeviceOS();
    if (device === 'ios') setActiveTab('ios');
    else if (device === 'windows' || device === 'mac') setActiveTab('desktop');
    else setActiveTab('android');
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://modelpublicschool.vercel.app';
  const appUrl = `${currentOrigin}/app`;

  const handleNativeInstall = async () => {
    setInstallStatus('prompting');
    const result = await promptInstallApp();
    if (result === 'accepted') {
      setInstallStatus('installed');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (result === 'dismissed') {
      setInstallStatus('dismissed');
    } else {
      // Direct redirect if native prompt not triggered
      window.location.href = '/app';
    }
  };

  const handleOpenApp = () => {
    window.location.href = '/app';
  };

  // QR Code URL using standard Google Charts QR API or canvas
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&color=090d16&bgcolor=ffffff&qzone=2`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding */}
        <div className="relative p-6 bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border border-white/20 flex-shrink-0">
              <img
                src={settings?.logo_url || '/logo.png'}
                alt="MPS Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-amber-500/30">
                <Sparkles className="w-3 h-3" /> Official App
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                MPS
              </h2>
              <p className="text-xs text-slate-300">
                Model Public School Student & Parent Companion App · Zero Ads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Quick Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleNativeInstall}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all transform active:scale-98 border border-blue-400/30 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>{canInstall ? 'Install MPS App on this Device' : 'Install / Download MPS App'}</span>
            </button>

            <button
              onClick={handleOpenApp}
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2.5 transition-all border border-slate-700 cursor-pointer"
            >
              <ExternalLink className="w-5 h-5 text-amber-400" />
              <span>Launch MPS App Now</span>
            </button>
          </div>

          {installStatus === 'installed' && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>MPS installed successfully! Check your home screen.</span>
            </div>
          )}

          {/* Device Specific Installation Instructions */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" /> How to Install on your Device
              </h3>
              
              {/* Platform Selector Tabs */}
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'android'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'ios'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" /> iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'desktop'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> PC / Mac
                </button>
              </div>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Automatic 1-Tap Install:</strong>
                    Click the <span className="text-blue-400 font-bold">"Install App on this Device"</span> button above, then tap <span className="text-emerald-400 font-bold">"Install"</span> on the browser prompt.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Manual Chrome / Edge Menu:</strong>
                    Tap the <strong>three dots menu (⋮)</strong> at top right of Chrome, and select <span className="text-amber-400 font-bold">"Install app"</span> or <span className="text-amber-400 font-bold">"Add to Home screen"</span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Instant Launcher Shortcut:</strong>
                    You can also{' '}
                    <button
                      onClick={() => downloadWebAppLauncher('MPS')}
                      className="text-amber-400 underline font-bold hover:text-amber-300"
                    >
                      Download the App Launcher file (.html)
                    </button>{' '}
                    to open the app instantly without app store logins!
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      Open in Safari Browser:
                    </strong>
                    Make sure you are viewing this page in Apple <strong>Safari</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      Tap Share Button <Share2 className="w-3.5 h-3.5 text-blue-400 inline" />:
                    </strong>
                    Tap the square share icon with an upward arrow at the bottom toolbar of Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-semibold flex items-center gap-1.5">
                      Tap "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />:
                    </strong>
                    Scroll down in the share sheet and tap <span className="text-amber-400 font-bold">"Add to Home Screen"</span>, then tap <strong>Add</strong> at top right. The MPS icon will appear directly on your iPhone home screen!
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Address Bar Install Icon:</strong>
                    In Google Chrome, Brave, or Microsoft Edge, look for the <strong>Install icon (⊕ or computer with arrow)</strong> on the right side of the address URL bar.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Standalone Window Mode:</strong>
                    Once installed, the Student App runs in its own distraction-free desktop window with high performance and zero browser address bars.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section for Scanning from Mobile */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-700 flex-shrink-0">
              <img
                src={qrCodeUrl}
                alt="Scan to open Student App"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                <QrCode className="w-3.5 h-3.5" /> Scan with Phone Camera
              </div>
              <h4 className="text-sm font-black text-white">Instant Mobile QR Code</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan this QR code with any smartphone camera to open and install the MPS Student Portal directly on your mobile device.
              </p>
              <p className="text-[11px] font-mono text-blue-400 break-all pt-1">
                {appUrl}
              </p>
            </div>
          </div>

          {/* Features in this App */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Included in the Student App:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Daily Homework</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Live Attendance</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>AI Study Tutor</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Exam Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted & Verified Official App</span>
          </div>
          <button
            onClick={handleOpenApp}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
          >
            <span>Launch Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
