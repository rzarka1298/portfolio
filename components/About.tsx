import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Coffee, Code2, Palette, Zap } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import PortfolioViews from './PortfolioViews';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const highlights = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Full-Stack Developer",
      description: "Skilled in Python, Java, JavaScript, TypeScript, React"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "AI/ML Engineer",
      description: "Building AI-driven applications and data-intensive systems"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Research Assistant",
      description: "Developing interactive touchscreen systems and robotics"
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Software Engineering Student",
      description: "Passionate about innovation and problem-solving"
    }
  ];

  const stats = [
    { number: "4+", label: "Research Projects" },
    { number: "3+", label: "Years Experience" },
    { number: "10+", label: "Technologies Used" },
    { number: "100%", label: "Commitment to Innovation" }
  ];

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl mb-4">About Me</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Passionate about creating digital experiences that make a difference
          </p>
          
          {/* Portfolio Views Counter */}
          <PortfolioViews isInView={isInView} delay={0.6} />
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative w-full max-w-md mx-auto">
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl"
              animate={isInView ? { rotate: [0, 360] } : {}}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative bg-card rounded-3xl p-4 shadow-2xl">
              <ImageWithFallback
                src="../assets/background.png"
                alt="Rugved Zarkar Profile Photo"
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
          </div>
        </motion.div>

        {/* About Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-lg leading-relaxed">
              Hi there! I'm passionate about computer science and its power to drive innovation and solve 
              complex problems. With experience in software engineering, AI development, and research, 
              I have worked on projects ranging from building AI-driven chatbots to developing patent 
              search algorithms and interactive touchscreen systems.
            </p>
            
            <p className="text-lg leading-relaxed">
              My skills in Python, Java, and cloud computing, combined with hands-on experience in 
              machine learning and robotics, enable me to create impactful, scalable solutions. I 
              specialize in building scalable, AI-driven applications and data-intensive systems.
            </p>
            
            <p className="text-lg leading-relaxed">
              When I'm not coding, you'll find me working on research projects, exploring the latest 
              AI technologies, or contributing to open-source projects. I believe that technology 
              should enhance human capabilities and solve real-world problems.
            </p>
          </div>

          {/* Fun Fact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-primary/10 rounded-2xl p-6 border border-primary/20"
          >
            <h4 className="mb-2">🤖 Fun Fact</h4>
            <p className="text-muted-foreground">
              I'm currently developing interactive touchscreen technology for Calico, a miniature relocatable 
              wearable system that can move around on your body! It's like having a tiny robot companion 
              that can sense your actions and provide real-time feedback.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Highlights Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {highlights.map((highlight, index) => (
          <motion.div
            key={highlight.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  {highlight.icon}
                </div>
                <h4 className="mb-2">{highlight.title}</h4>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {stats.map((stat, index) => (
          <div key={stat.label} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index, type: "spring" }}
              className="text-3xl md:text-4xl text-primary mb-2"
            >
              {stat.number}
            </motion.div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}