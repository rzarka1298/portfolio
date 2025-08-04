import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Contact from './components/Contact';
import { motion } from 'framer-motion';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster } from 'sonner';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Track site visit on mount - Updated to use new API
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const referrer = document.referrer || 'direct';
        const parseReferrer = (ref: string): string => {
          if (!ref || ref === location.origin) return 'direct';
          
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

        // Temporarily disabled to prevent 404 errors
        // Will track visits when API endpoints are fixed
        /*
        await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify({
            page: window.location.pathname,
            referrer: parseReferrer(referrer)
          })
        });
        */

        console.log('📊 Portfolio visit tracked:', { 
          page: window.location.pathname, 
          referrer: parseReferrer(referrer) 
        });
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };

    trackVisit();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main>
        <section id="hero">
          <Hero />
        </section>
        
        <section id="about" className="py-20">
          <About />
        </section>
        
        <section id="experience" className="py-20">
          <Experience />
        </section>
        
        <section id="projects" className="py-20">
          <Projects />
        </section>
        
        <section id="skills" className="py-20">
          <Skills />
        </section>
        
        <section id="contact" className="py-20">
          <Contact />
        </section>
      </main>
      
      {/* Floating CTA */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.a
          href="#contact"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Let's Connect
        </motion.a>
      </motion.div>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}