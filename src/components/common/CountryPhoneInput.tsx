import React, { useState, useEffect } from 'react';

export interface CountryOption {
  code: string;
  country: string;
  flag: string;
  iso: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', iso: 'US' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', iso: 'NP' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', iso: 'BD' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', iso: 'PK' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', iso: 'LK' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', iso: 'QA' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', iso: 'KW' },
  { code: '+968', country: 'Oman', flag: '🇴🇲', iso: 'OM' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', iso: 'MY' }
];

export const fetchUserCountryCodeFromIP = async (): Promise<string> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code) {
        const iso = String(data.country_code).toUpperCase();
        const found = COUNTRY_OPTIONS.find(c => c.iso === iso);
        if (found) return found.code;
      }
    }
  } catch (e) {
    // IP lookup failed or aborted
  }
  return detectUserCountryCode();
};

export const detectUserCountryCode = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();

    if (tz.includes('Kolkata') || tz.includes('Calcutta') || lang.includes('-in') || lang.includes('hi')) return '+91';
    if (tz.includes('America') || lang.includes('-us') || lang.includes('-ca')) return '+1';
    if (tz.includes('London') || lang.includes('-gb')) return '+44';
    if (tz.includes('Dubai')) return '+971';
    if (tz.includes('Riyadh')) return '+966';
    if (tz.includes('Kathmandu')) return '+977';
    if (tz.includes('Dhaka')) return '+880';
    if (tz.includes('Karachi')) return '+92';
    if (tz.includes('Colombo')) return '+94';
    if (tz.includes('Singapore')) return '+65';
    if (tz.includes('Australia')) return '+61';
    if (tz.includes('Berlin')) return '+49';
    if (tz.includes('Paris')) return '+33';
  } catch (e) {
    // ignore
  }
  return '+91';
};

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string, countryCode: string, fullNumber: string) => void;
  selectedCountryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  selectedCountryCode,
  onCountryCodeChange,
  placeholder = 'Enter mobile number',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  selectClassName = ''
}) => {
  const [internalCountryCode, setInternalCountryCode] = useState<string>(() => {
    return selectedCountryCode || detectUserCountryCode();
  });

  useEffect(() => {
    if (selectedCountryCode) {
      setInternalCountryCode(selectedCountryCode);
    } else {
      let isMounted = true;
      fetchUserCountryCodeFromIP().then(code => {
        if (isMounted && code) {
          setInternalCountryCode(code);
          if (onCountryCodeChange) {
            onCountryCodeChange(code);
          }
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [selectedCountryCode]);

  const activeCountryCode = selectedCountryCode || internalCountryCode;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setInternalCountryCode(newCode);
    if (onCountryCodeChange) {
      onCountryCodeChange(newCode);
    }
    const cleanDigits = value.replace(/\D/g, '');
    const fullNumber = `${newCode}${cleanDigits}`;
    onChange(value, newCode, fullNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');
    const fullNumber = `${activeCountryCode}${cleanDigits}`;
    onChange(rawVal, activeCountryCode, fullNumber);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <select
        value={activeCountryCode}
        onChange={handleCountryChange}
        disabled={disabled}
        className={`px-3 py-2.5 bg-slate-900 dark:bg-slate-900 border border-r-0 border-slate-700 text-amber-400 font-bold text-xs rounded-l-xl focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${selectClassName}`}
      >
        {COUNTRY_OPTIONS.map(c => (
          <option key={c.code + c.iso} value={c.code} className="bg-slate-800 text-white font-medium py-1">
            {c.flag} {c.code} ({c.iso})
          </option>
        ))}
      </select>
      <input
        type="text"
        required={required}
        disabled={disabled}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full p-2.5 rounded-r-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium ${inputClassName}`}
      />
    </div>
  );
};
