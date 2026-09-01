import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { Notice, NoticeBannerConfig } from '../../types';
import { useCMS } from '../../context/CMSContext';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { Bell, Sparkles, ExternalLink } from 'lucide-react';

export const NoticeTicker: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const bannerConfig: NoticeBannerConfig = useMemo(() => {
    return settings?.notice_banner || {
      enabled: true,
      badgeText: 'Notice',
      badgeColor: 'blue',
      customText: 'Admissions Open for Session 2026-27 (Nursery to Class 10). Online Registration & Entrance Forms Available!',
      useLiveNotices: true,
      linkText: 'Apply Now',
      linkUrl: '#admissions',
      speed: 'normal',
      isMarquee: true
    };
  }, [settings?.notice_banner]);

  const fetchNotices = useCallback(() => {
    api.getNotices(true).then(data => {
      const urgent = (data || []).filter(n => n.isUrgentTicker);
      setNotices(prev => {
        if (JSON.stringify(prev) === JSON.stringify(urgent)) return prev;
        return urgent;
      });
    }).catch(() => {
      // silent fallback
    });
  }, []);

  // Global Realtime Refresh hook for live notices
  const { refreshCount } = useSupabaseRealtimeRefresh(
    ['public:notice_board', 'public:site_settings'],
    useCallback((event) => {
      fetchNotices();
    }, [fetchNotices])
  );

  useEffect(() => {
    fetchNotices();

    const interval = setInterval(fetchNotices, 8000);
    const handleUpdate = () => {
      setTimeout(() => fetchNotices(), 0);
    };

    window.addEventListener('mps_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('mps_realtime_notice_board', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mps_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('mps_realtime_notice_board', handleUpdate);
    };
  }, [fetchNotices, refreshCount]);

  if (bannerConfig.enabled === false) {
    return null;
  }

  const hasUrgentNotices = notices.length > 0;
  const useUrgent = bannerConfig.useLiveNotices && hasUrgentNotices;

  const badgeColorClass = {
    blue: 'bg-blue-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-400 text-slate-950 font-bold',
    emerald: 'bg-emerald-600 text-white',
    purple: 'bg-purple-600 text-white'
  }[bannerConfig.badgeColor || 'blue'] || 'bg-blue-600 text-white';

  const durationSeconds = {
    slow: '48s',
    normal: '28s',
    fast: '16s'
  }[bannerConfig.speed || 'normal'] || '28s';

  const itemsToDisplay = useMemo(() => {
    if (useUrgent && notices.length > 0) {
      return notices.map((n, i) => ({
        id: n.id || `urgent-${i}`,
        title: n.title || 'Notice',
        content: n.content || ''
      }));
    }
    return [
      {
        id: 'default-custom-1',
        title: 'Admissions Open 2026-27',
        content: bannerConfig.customText || 'Admissions Open for Session 2026-27 (Nursery to Class 10). Online Registration & Entrance Forms Available!'
      }
    ];
  }, [useUrgent, notices, bannerConfig.customText]);

  const renderItemsTrack = (trackKey: string) => (
    <div key={trackKey} className="flex shrink-0 items-center gap-8 pr-8">
      {(itemsToDisplay.length < 3 ? [0, 1, 2] : [0]).flatMap((multiplier) =>
        itemsToDisplay.map((item, idx) => (
          <span
            key={`${trackKey}-${multiplier}-${item.id}-${idx}`}
            className="inline-flex items-center gap-2 whitespace-nowrap text-xs"
          >
            <span className="font-bold text-amber-300 tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              {item.title}:
            </span>
            <span className="text-slate-200 font-normal">{item.content}</span>
            <span className="text-slate-500 font-bold ml-4 select-none">•</span>
          </span>
        ))
      )}
    </div>
  );

  return (
    <div
      className="bg-slate-900 text-white py-1.5 px-4 border-b border-slate-800 flex items-center justify-between text-xs overflow-hidden relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 flex-shrink-0 z-10 bg-slate-900 pr-3">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-sm ${badgeColorClass}`}>
          <Bell className="w-2.5 h-2.5" />
          <span>{bannerConfig.badgeText || (useUrgent ? 'Urgent' : 'Notice')}</span>
        </span>
      </div>

      {/* Marquee Content Container */}
      <div className="flex-1 overflow-hidden relative mx-2">
        {bannerConfig.isMarquee !== false ? (
          <div
            className="flex w-max shrink-0 items-center animate-marquee"
            style={{
              animationDuration: durationSeconds,
              animationPlayState: isHovered ? 'paused' : 'running'
            }}
          >
            {renderItemsTrack('track-1')}
            {renderItemsTrack('track-2')}
          </div>
        ) : (
          <div className="flex items-center gap-4 overflow-x-auto py-0.5 scrollbar-none">
            {itemsToDisplay.map((item, idx) => (
              <span key={`static-${item.id}-${idx}`} className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
                <span className="font-bold text-amber-300">{item.title}:</span>
                <span className="text-slate-200">{item.content}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Link Button if provided */}
      {bannerConfig.linkText && bannerConfig.linkUrl && (
        <a
          href={bannerConfig.linkUrl}
          className="hidden sm:inline-flex items-center gap-1 ml-3 px-3 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-[10px] tracking-wide transition-all border border-white/15 flex-shrink-0 z-10 bg-slate-900"
        >
          <span>{bannerConfig.linkText}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
});
