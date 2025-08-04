import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Github, Linkedin, Mail } from 'lucide-react';
import { Button } from './ui/button';

export default function Hero() {
  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => {
          const size = Math.random() * 3 + 1; // Random size between 1-4
          const isGlowing = Math.random() > 0.7; // 30% chance to be extra glowing
          return (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                isGlowing 
                  ? 'bg-cyan-300/60 shadow-xl shadow-cyan-300/40 border border-cyan-200/30' 
                  : 'bg-cyan-400/30 shadow-lg shadow-cyan-400/20'
              }`}
              style={{
                width: `${size * 0.5}rem`,
                height: `${size * 0.5}rem`,
              }}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
                scale: 0
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 8 + 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
            />
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="text-primary bg-primary/10 px-4 py-2 rounded-full">
              👋 Hello, I'm a Software Engineering Student
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl mb-8 bg-gradient-to-r from-primary via-primary to-muted-foreground bg-clip-text text-transparent"
          >
            Rugved Zarkar
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed"
          >
            I am a skilled full-stack developer with expertise in building
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              {" "}AI-driven applications
            </motion.span>
            ,
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              {" "}wearable robotics
            </motion.span>
            , and
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.4 }}
            >
              {" "}scalable solutions
            </motion.span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button
              size="lg"
              onClick={scrollToAbout}
              className="group relative overflow-hidden"
            >
              View My Work
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </Button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center space-x-6 mb-16"
          >
            <motion.a
              href="mailto:rugvedzarkar@gmail.com"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-muted rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Mail className="w-6 h-6" />
            </motion.a>
            
            <motion.a
              href="https://github.com/rzarka1298"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-muted rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Github className="w-6 h-6" />
            </motion.a>
            
            <motion.a
              href="https://www.linkedin.com/in/rugved-zarkar-96878b2a4"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-muted rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            >
              <Linkedin className="w-6 h-6" />
            </motion.a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.button
            onClick={scrollToAbout}
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors duration-300"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm mb-2">Scroll to explore</span>
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}