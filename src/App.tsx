import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CMSProvider } from './context/CMSContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/common/Header';
import { NoticeTicker } from './components/public/NoticeTicker';
import { HeroSection } from './components/public/HeroSection';
import { AboutSection } from './components/public/AboutSection';

// Eager & Fast Fallback Shell
const SectionSkeleton = () => <div className="w-full min-h-[80px]" />;

// Helper to retry dynamic imports if network/cache issue occurs
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<any>,
  namedExport?: string
) {
  return React.lazy(async () => {
    try {
      const module = await componentImport();
      if (namedExport && module[namedExport]) {
        return { default: module[namedExport] };
      }
      return { default: module.default || module[Object.keys(module)[0]] };
    } catch (error) {
      console.warn('Initial dynamic import failed, retrying once...', error);
      try {
        await new Promise(res => setTimeout(res, 400));
        const module = await componentImport();
        if (namedExport && module[namedExport]) {
          return { default: module[namedExport] };
        }
        return { default: module.default || module[Object.keys(module)[0]] };
      } catch (retryError) {
        console.error('Dynamic module import failed after retry:', retryError);
        throw retryError;
      }
    }
  });
}

// Lazy Load Heavy Sub-sections and Portals with Resilience
const FacilitiesSection = lazyRetry(() => import('./components/public/FacilitiesSection'), 'FacilitiesSection');
const GallerySection = lazyRetry(() => import('./components/public/GallerySection'), 'GallerySection');
const FeesSection = lazyRetry(() => import('./components/public/FeesSection'), 'FeesSection');
const ThreeDSolarSystem = lazyRetry(() => import('./components/common/ThreeDSolarSystem'), 'ThreeDSolarSystem');
const AdmissionsSection = lazyRetry(() => import('./components/public/AdmissionsSection'), 'AdmissionsSection');
const FacultySection = lazyRetry(() => import('./components/public/FacultySection'), 'FacultySection');
const FAQSection = lazyRetry(() => import('./components/public/FAQSection'), 'FAQSection');
const ContactSection = lazyRetry(() => import('./components/public/ContactSection'), 'ContactSection');
const Footer = lazyRetry(() => import('./components/common/Footer'), 'Footer');

const TeacherWorkspace = lazyRetry(() => import('./components/teacher/TeacherWorkspace'), 'TeacherWorkspace');
const StaffDriverPortal = lazyRetry(() => import('./components/staff/StaffDriverPortal'), 'StaffDriverPortal');
const AdminControlCenter = lazyRetry(() => import('./components/admin/AdminControlCenter'), 'AdminControlCenter');
const StudentPortal = lazyRetry(() => import('./components/portal/StudentPortal'), 'StudentPortal');
const StudentAppShell = lazyRetry(() => import('./components/portal/StudentAppShell'), 'StudentAppShell');
const PublicHomepageBackground = lazyRetry(() => import('./components/common/PublicHomepageBackground'), 'PublicHomepageBackground');
const FallingStarsCanvas = lazyRetry(() => import('./components/common/FallingStarsCanvas'), 'FallingStarsCanvas');

import { UniversalPortalSwitcher } from './components/common/UniversalPortalSwitcher';

const PageLoader = () => (
  <div className="min-h-[300px] flex items-center justify-center py-16">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const computeRoute = (pathname?: string, searchStr?: string, hashStr?: string): string => {
    const cleanPath = (pathname || window.location.pathname || '').toLowerCase();
    const cleanHash = (hashStr !== undefined ? hashStr : window.location.hash || '').toLowerCase();
    const params = new URLSearchParams(searchStr !== undefined ? searchStr : window.location.search || '');
    const portalParam = (params.get('portal') || params.get('view') || params.get('role') || params.get('page') || '').toLowerCase();

    if (portalParam === 'admin' || cleanPath.startsWith('/admin') || cleanHash === '#admin') return 'admin';
    if (portalParam === 'teacher' || portalParam === 'teachers' || cleanPath.startsWith('/teacher') || cleanPath.startsWith('/teachers') || cleanHash === '#teacher' || cleanHash === '#teachers') return 'teacher';
    if (portalParam === 'staff' || portalParam === 'driver' || portalParam === 'drivers' || portalParam === 'transport' || cleanPath.startsWith('/staff') || cleanPath.startsWith('/driver') || cleanPath.startsWith('/transport') || cleanHash === '#staff' || cleanHash === '#driver' || cleanHash === '#transport') return 'staff';
    if (
      portalParam === 'portal' || portalParam === 'student' || portalParam === 'students' || portalParam === 'profile' || portalParam === 'student-profile' ||
      cleanPath.startsWith('/portal') || cleanPath.startsWith('/student') || cleanPath.startsWith('/students') || cleanPath.startsWith('/profile') ||
      cleanHash === '#portal' || cleanHash === '#student' || cleanHash === '#students' || cleanHash === '#profile'
    ) return 'portal';
    if (cleanPath.startsWith('/app') || cleanPath.startsWith('/student-app') || params.get('mode') === 'student-app' || params.get('app') === 'student' || cleanHash === '#app') {
      return 'student-app';
    }
    return 'public';
  };

  const [route, setRoute] = useState<string>(() => {
    return computeRoute(window.location.pathname, window.location.search, window.location.hash);
  });

  useEffect(() => {
    const saved = localStorage.getItem('mps_dark_mode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
    }

    const handlePopState = () => {
      setRoute(computeRoute(window.location.pathname, window.location.search, window.location.hash));
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      const isHashOnly = href.startsWith('#');
      const isInternalPath = (href.startsWith('/') && !href.startsWith('//')) || isHashOnly;

      if (isInternalPath && !target.getAttribute('target') && !target.getAttribute('download')) {
        let targetUrl: URL;
        try {
          targetUrl = new URL(href, window.location.origin);
        } catch {
          return;
        }

        if (targetUrl.origin === window.location.origin) {
          const lowerHash = (targetUrl.hash || '').toLowerCase();
          const isPortalHash = ['#portal', '#student', '#profile', '#teacher', '#teachers', '#staff', '#driver', '#admin'].includes(lowerHash);

          // If standard in-page jump on current homepage
          if (!isPortalHash && targetUrl.pathname === window.location.pathname && targetUrl.hash && route === 'public') {
            return;
          }

          e.preventDefault();
          try {
            window.history.pushState({}, '', href);
          } catch {
            try {
              if (isPortalHash) window.location.hash = lowerHash;
            } catch (_) {}
          }

          const newRoute = computeRoute(targetUrl.pathname, targetUrl.search, targetUrl.hash);
          setRoute(newRoute);

          if (targetUrl.hash && !isPortalHash) {
            setTimeout(() => {
              const el = document.querySelector(targetUrl.hash);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    document.addEventListener('click', handleLinkClick);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [route]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CMSProvider>
          <div className="min-h-screen bg-brand-bg text-brand-text font-body transition-colors selection:bg-amber-500 selection:text-slate-950 relative">
            <Suspense fallback={null}>
              {route === 'public' ? <PublicHomepageBackground /> : <FallingStarsCanvas />}
            </Suspense>

            {route === 'student-app' ? (
              <Suspense fallback={<PageLoader />}>
                <StudentAppShell />
              </Suspense>
            ) : route === 'teacher' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <TeacherWorkspace />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>
            ) : route === 'staff' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <StaffDriverPortal />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>
            ) : route === 'admin' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <AdminControlCenter />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>
            ) : route === 'portal' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <StudentPortal />
                </Suspense>
                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>
            ) : (
              <div>
                <Header />
                <NoticeTicker />
                <main>
                  <HeroSection />
                  <AboutSection />
                  <Suspense fallback={<SectionSkeleton />}>
                    <FacilitiesSection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <GallerySection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <FeesSection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <ThreeDSolarSystem />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <AdmissionsSection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <FacultySection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <FAQSection />
                  </Suspense>
                  <Suspense fallback={<SectionSkeleton />}>
                    <ContactSection />
                  </Suspense>
                </main>
                <Suspense fallback={null}>
                  <Footer />
                </Suspense>
              </div>
            )}

            {/* Always-accessible Universal Portal Navigator Dock */}
            <UniversalPortalSwitcher currentRoute={route} />
          </div>
        </CMSProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
