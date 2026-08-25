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

// Lazy Load Heavy Sub-sections and Portals
const FacilitiesSection = React.lazy(() => import('./components/public/FacilitiesSection').then(m => ({ default: m.FacilitiesSection })));
const GallerySection = React.lazy(() => import('./components/public/GallerySection').then(m => ({ default: m.GallerySection })));
const FeesSection = React.lazy(() => import('./components/public/FeesSection').then(m => ({ default: m.FeesSection })));
const ThreeDSolarSystem = React.lazy(() => import('./components/common/ThreeDSolarSystem').then(m => ({ default: m.ThreeDSolarSystem })));
const AdmissionsSection = React.lazy(() => import('./components/public/AdmissionsSection').then(m => ({ default: m.AdmissionsSection })));
const FacultySection = React.lazy(() => import('./components/public/FacultySection').then(m => ({ default: m.FacultySection })));
const FAQSection = React.lazy(() => import('./components/public/FAQSection').then(m => ({ default: m.FAQSection })));
const ContactSection = React.lazy(() => import('./components/public/ContactSection').then(m => ({ default: m.ContactSection })));
const Footer = React.lazy(() => import('./components/common/Footer').then(m => ({ default: m.Footer })));

const TeacherWorkspace = React.lazy(() => import('./components/teacher/TeacherWorkspace').then(m => ({ default: m.TeacherWorkspace })));
const AdminControlCenter = React.lazy(() => import('./components/admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter })));
const StudentPortal = React.lazy(() => import('./components/portal/StudentPortal').then(m => ({ default: m.StudentPortal })));
const StudentAppShell = React.lazy(() => import('./components/portal/StudentAppShell').then(m => ({ default: m.StudentAppShell })));
const PublicHomepageBackground = React.lazy(() => import('./components/common/PublicHomepageBackground').then(m => ({ default: m.PublicHomepageBackground })));
const FallingStarsCanvas = React.lazy(() => import('./components/common/FallingStarsCanvas').then(m => ({ default: m.FallingStarsCanvas })));

const PageLoader = () => (
  <div className="min-h-[300px] flex items-center justify-center py-16">
    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const [route, setRoute] = useState<string>(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const isStandalone = typeof window !== 'undefined' && ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches);
    if (path.startsWith('/app') || path.startsWith('/student-app') || search.includes('mode=student-app') || search.includes('app=student') || (isStandalone && !path.startsWith('/admin') && !path.startsWith('/teacher'))) {
      return 'student-app';
    }
    if (path.startsWith('/teacher')) return 'teacher';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/portal')) return 'portal';
    return 'public';
  });

  useEffect(() => {
    const saved = localStorage.getItem('mps_dark_mode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
      if (path.startsWith('/app') || path.startsWith('/student-app') || search.includes('mode=student-app') || search.includes('app=student') || (isStandalone && !path.startsWith('/admin') && !path.startsWith('/teacher'))) {
        setRoute('student-app');
      }
      else if (path.startsWith('/teacher')) setRoute('teacher');
      else if (path.startsWith('/admin')) setRoute('admin');
      else if (path.startsWith('/portal')) setRoute('portal');
      else setRoute('public');
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      // Handle internal relative paths like /, /portal, /teacher, /admin, /#about
      if (href.startsWith('/') && !href.startsWith('//') && !target.getAttribute('target') && !target.getAttribute('download')) {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          // If just an in-page hash jump on current path
          if (url.pathname === window.location.pathname && url.hash) {
            return;
          }
          e.preventDefault();
          window.history.pushState({}, '', href);
          handlePopState();
          if (url.hash) {
            setTimeout(() => {
              const el = document.querySelector(url.hash);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

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
          </div>
        </CMSProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
