import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import NotFound from './components/NotFound';
import ScrollManager from './components/ScrollManager';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster } from 'sonner';

// Project pages pull in React Flow; keep them out of the home page bundle.
const ProjectPageRoute = lazy(() => import('./components/project/ProjectPage'));

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const isFirstVisit = useRef(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Track a visit on first load and on every client-side route change.
  // document.referrer only describes the initial page load, so later
  // in-app navigations are reported with referrer 'internal'.
  useEffect(() => {
    const firstVisit = isFirstVisit.current;
    isFirstVisit.current = false;

    const trackVisit = async () => {
      try {
        const referrer = document.referrer;
        const parseReferrer = (ref: string): string => {
          if (!ref || ref === window.location.origin) return 'direct';

          try {
            const url = new URL(ref);
            const domain = url.hostname.toLowerCase();

            if (domain.includes('google')) return 'google';
            if (domain.includes('linkedin')) return 'linkedin';
            if (domain.includes('github')) return 'github';
            if (domain.includes('twitter') || domain.includes('x.com')) return 'twitter';
            if (domain.includes('facebook')) return 'facebook';
            if (domain.includes('reddit')) return 'reddit';
            if (domain.includes('dev.to')) return 'dev.to';
            if (domain.includes('medium')) return 'medium';

            return domain;
          } catch {
            return 'unknown';
          }
        };

        const visit = {
          page: window.location.pathname,
          referrer: firstVisit ? parseReferrer(referrer) : 'internal'
        };

        await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify(visit)
        });

        console.log('📊 Portfolio visit tracked:', visit);
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };

    trackVisit();
  }, [location.pathname]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <ScrollManager />
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/projects/:slug"
          element={
            <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
              <ProjectPageRoute />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
