import { motion } from 'framer-motion';
import Hero from './Hero';
import About from './About';
import Projects from './Projects';
import Experience from './Experience';
import Skills from './Skills';
import Contact from './Contact';

/** The original single-page site, rendered at `/`. */
export default function HomePage() {
  return (
    <>
      <main>
        <section id="hero">
          <Hero />
        </section>

        <section id="about" className="py-20 overflow-x-clip">
          <About />
        </section>

        <section id="experience" className="py-20 overflow-x-clip">
          <Experience />
        </section>

        <section id="projects" className="py-20">
          <Projects />
        </section>

        <section id="skills" className="py-20">
          <Skills />
        </section>

        <section id="contact" className="py-20 overflow-x-clip">
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
    </>
  );
}
