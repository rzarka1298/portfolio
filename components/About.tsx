import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Coffee, Code2, Palette, Zap, GraduationCap } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import PortfolioViews from './PortfolioViews';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const highlights = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Infrastructure Engineer",
      description: "Scaling DNS and cloud platforms to 1M+ QPS at AWS and IBM"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "AI/ML Engineer",
      description: "Building RAG systems, diffusion models, and agent orchestration"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Research Assistant",
      description: "Published wearable robotics work at ACM IMWUT with UMIACS"
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Founder",
      description: "Bootstrapped an AI startup to $20K+ ARR and 20+ people"
    }
  ];

  const education = {
    school: "University of Maryland, College Park",
    degree: "Bachelor of Science in Computer Science",
    graduation: "Expected December 2027",
    gpa: "3.83 / 4.00",
    coursework: [
      "Advanced Data Structures",
      "Machine Learning",
      "Compilers",
      "Computer Vision",
      "Operating Systems",
      "Database Systems",
      "Algorithms",
      "Object-Oriented Programming"
    ]
  };

  const stats = [
    { number: "6+", label: "Years Experience" },
    { number: "8", label: "Professional Roles" },
    { number: "30+", label: "Technologies Used" },
    { number: "3.83", label: "GPA at UMD" }
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
                src="/background.png"
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
              Hi there! I'm a Computer Science student at the University of Maryland who works at the
              seam between infrastructure and AI. At IBM I architected a recursive DNS platform and
              scaled it 10× to over 1M QPS; I'm now on the Domain Name Services team at AWS, working
              on DNS at global scale.
            </p>

            <p className="text-lg leading-relaxed">
              On the AI side, I've built RAG pipelines serving Southern African education ministries,
              fine-tuned diffusion models for semiconductor metrology at NIST, and founded RAGent LLC,
              which I grew to $20K+ ARR and a 20+ person team. I also do wearable robotics research at
              UMIACS on Calico, published at ACM IMWUT.
            </p>

            <p className="text-lg leading-relaxed">
              What ties it together is a bias toward systems that hold up in production — measured,
              observable, and reliable. That's the idea behind HarnessFlow, my open-source framework
              for compiling AI agent pipelines into deterministic workflows.
            </p>
          </div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 text-primary">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-1">{education.school}</h4>
                    <p className="text-primary text-sm mb-2">{education.degree}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                      <span>{education.graduation}</span>
                      <span>GPA {education.gpa}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Relevant coursework</p>
                    <div className="flex flex-wrap gap-2">
                      {education.coursework.map((course) => (
                        <Badge key={course} variant="outline" className="text-xs">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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