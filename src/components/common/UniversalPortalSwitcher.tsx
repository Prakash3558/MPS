import React from 'react';
import { GraduationCap, UserCheck, Bus, ShieldAlert, Home } from 'lucide-react';

interface UniversalPortalSwitcherProps {
  currentRoute: string;
}

export const UniversalPortalSwitcher: React.FC<UniversalPortalSwitcherProps> = ({ currentRoute }) => {
  const portals = [
    {
      id: 'public',
      label: 'Home',
      shortLabel: 'Home',
      href: '/',
      icon: Home,
      color: 'hover:text-blue-500'
    },
    {
      id: 'portal',
      label: 'Student Profile',
      shortLabel: 'Student',
      href: '/portal',
      icon: GraduationCap,
      color: 'hover:text-amber-500'
    },
    {
      id: 'teacher',
      label: 'Teacher Portal',
      shortLabel: 'Teacher',
      href: '/teacher',
      icon: UserCheck,
      color: 'hover:text-emerald-500'
    },
    {
      id: 'staff',
      label: 'Driver & Bus GPS',
      shortLabel: 'Bus GPS',
      href: '/staff',
      icon: Bus,
      color: 'hover:text-indigo-500'
    },
    {
      id: 'admin',
      label: 'Admin Control',
      shortLabel: 'Admin',
      href: '/admin',
      icon: ShieldAlert,
      color: 'hover:text-rose-500'
    }
  ];

  return (
    <aside
      aria-label="Portal Quick Navigator"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] sm:max-w-fit pointer-events-auto"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-white">
        {portals.map((p) => {
          const Icon = p.icon;
          const isActive = currentRoute === p.id;
          return (
            <a
              key={p.id}
              href={p.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title={`Switch to ${p.label}`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="hidden md:inline whitespace-nowrap">{p.label}</span>
              <span className="md:hidden whitespace-nowrap">{p.shortLabel}</span>
            </a>
          );
        })}
      </div>
    </aside>
  );
};
