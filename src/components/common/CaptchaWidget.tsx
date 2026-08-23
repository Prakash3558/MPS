import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  isVerified?: boolean;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify, isVerified = false }) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(isVerified);

  const handleCheckboxClick = () => {
    if (verified || verifying) return;
    setVerifying(true);

    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      const token = 'captcha-verified-' + Date.now();
      onVerify(token);
    }, 1200);
  };

  return (
    <div className="p-3 bg-slate-900/90 border border-amber-500/40 rounded-2xl shadow-lg my-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={verified || verifying}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              verified
                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                : verifying
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-slate-500 hover:border-amber-400 bg-slate-800'
            }`}
          >
            {verifying && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            {verified && <CheckCircle2 className="w-4 h-4 text-slate-950 font-black" />}
          </button>
          <div>
            <span className="font-bold text-slate-200 block">
              {verified ? 'Security Check Verified' : 'Verify you are human'}
            </span>
            <span className="text-[10px] text-slate-400">
              {verified ? 'Token attached to login request' : 'Required after multiple login attempts'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end opacity-75">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Turnstile CAPTCHA</span>
          </div>
          <span className="text-[8px] text-slate-500">Privacy & Terms</span>
        </div>
      </div>
    </div>
  );
};
