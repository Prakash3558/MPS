import React, { useState, useEffect, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CMSProvider } from './context/CMSContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { NoticeTicker } from './components/public/NoticeTicker';
import { HeroSection } from './components/public/HeroSection';
import { AboutSection } from './components/public/AboutSection';
import { FacultySection } from './components/public/FacultySection';
import { FacilitiesSection } from './components/public/FacilitiesSection';
import { GallerySection } from './components/public/GallerySection';
import { FeesSection } from './components/public/FeesSection';
import { AdmissionsSection } from './components/public/AdmissionsSection';
import { FAQSection } from './components/public/FAQSection';
import { ContactSection } from './components/public/ContactSection';
import { AdminCMSToolbar } from './components/cms/AdminCMSToolbar';
import PublicHomepageBackground from './components/common/PublicHomepageBackground';
import { FallingStarsCanvas } from './components/common/FallingStarsCanvas';

// Lazy Load Heavy Admin, Teacher & Student Portal Modules
const ThreeDSolarSystem = React.lazy(() => import('./components/common/ThreeDSolarSystem').then(m => ({ default: m.ThreeDSolarSystem })));
const TeacherWorkspace = React.lazy(() => import('./components/teacher/TeacherWorkspace').then(m => ({ default: m.TeacherWorkspace })));
const AdminControlCenter = React.lazy(() => import('./components/admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter })));
const StudentPortal = React.lazy(() => import('./components/portal/StudentPortal').then(m => ({ default: m.StudentPortal })));
const StudentAppShell = React.lazy(() => import('./components/portal/StudentAppShell').then(m => ({ default: m.StudentAppShell })));
const FloatingAIWidget = React.lazy(() => import('./components/common/FloatingAIWidget').then(m => ({ default: m.FloatingAIWidget })));

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

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
                <Footer />
              </div>
            ) : route === 'admin' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <AdminControlCenter />
                </Suspense>
                <Footer />
              </div>
            ) : route === 'portal' ? (
              <div>
                <Header />
                <Suspense fallback={<PageLoader />}>
                  <StudentPortal />
                </Suspense>
                <Footer />
              </div>
            ) : (
              <div>
                <Header />
                <NoticeTicker />
                <main>
                  <HeroSection />
                  <AboutSection />
                  <FacilitiesSection />
                  <GallerySection />
                  <FeesSection />
                  <Suspense fallback={<PageLoader />}>
                    <ThreeDSolarSystem />
                  </Suspense>
                  <AdmissionsSection />
                  <FacultySection />
                  <FAQSection />
                  <ContactSection />
                </main>
                <Footer />
              </div>
            )}

            {(route === 'portal' || route === 'student-app') && (
              <Suspense fallback={null}>
                <FloatingAIWidget />
              </Suspense>
            )}
          </div>
        </CMSProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
