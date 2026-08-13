import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Github, ExternalLink, Play, Filter, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Project {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  category: string;
  tags: string[];
  results: string;
  /** Omitted when the project has no public repo — the Code button is hidden */
  github?: string;
  /** Omitted when the project has no live demo — the Demo button is hidden */
  demo?: string;
}

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [projectViews, setProjectViews] = useState<Record<string, number>>({});

  const projects: Project[] = [
    {
      id: 1,
      title: "HarnessFlow",
      description: "An open-source framework that lets developers define AI agent pipelines in YAML and compiles them into deterministic, production-reliable workflows.",
      longDescription: "HarnessFlow solves the problem of unpredictable agent behavior in production systems. YAML workflow definitions compile into Temporal-orchestrated runs executed by a polyglot Go (Connect-Go, sqlc) and Python runtime, with model fallback and approval-gate signals built in. The platform is instrumented with OpenTelemetry GenAI conventions and ships an eval-gated CI pipeline using LLM-as-judge, embedding similarity, and cost/latency scorers — essentially GitHub Actions, Temporal, and Datadog for AI agents.",
      image: "/projects/project-2.jpg",
      category: "AI/ML",
      tags: ["Go", "Python", "Temporal", "YAML", "OpenTelemetry", "Connect-Go", "sqlc"],
      github: "https://github.com/rzarka1298/harnessflow",
      results: "Open-source agent orchestration platform"
    },
    {
      id: 2,
      title: "Lane-Optimize",
      description: "Reinforcement learning for real-time highway lane optimization in SUMO, with a live FastAPI/React dashboard.",
      longDescription: "Lane-Optimize applies reinforcement learning to real-time highway lane assignment inside the SUMO traffic simulator. It implements a from-scratch PyTorch DQN alongside Stable-Baselines3 PPO and a multi-agent shared-policy PPO, benchmarked against rule-based baselines to quantify how much RL actually buys over conventional traffic heuristics. A live FastAPI backend and React dashboard visualize policy behavior and throughput as episodes run.",
      image: "/projects/project-3.jpg",
      category: "AI/ML",
      tags: ["PyTorch", "Stable-Baselines3", "SUMO", "FastAPI", "React", "Multi-Agent RL"],
      github: "https://github.com/rzarka1298/Lane-Optimize",
      results: "RL vs. rule-based traffic benchmarks"
    },
    {
      id: 3,
      title: "Calico Smartlabs",
      description: "A fully functional miniature relocatable wearable system with fast and precise locomotion for on-body interaction, actuation, and sensing.",
      longDescription: "Calico is a miniature robot that relocates across the human body while providing interactive touchscreen capabilities. Built on an ESP32-S3 with C++ and Python firmware, it integrates an IMU sensor pipeline and WiFi communication stack, displaying anatomical imagery on its touchscreen UI. Published at ACM IMWUT, featured in IEEE Spectrum and The Verge, and demonstrated at CHI and UbiComp.",
      image: "/projects/calico.png",
      category: "Hardware",
      tags: ["C++", "Python", "ESP32-S3", "IMU Sensors", "Embedded Systems"],
      github: "https://github.com/jsli96/onBodyRobot",
      demo: "https://smartlab.cs.umd.edu",
      results: "ACM IMWUT published, featured in IEEE Spectrum"
    },
    {
      id: 4,
      title: "BiasGPT",
      description: "A DistilBERT bias classifier paired with counterfactual demographic swapping to measure how text sentiment shifts when identity changes.",
      longDescription: "BiasGPT fine-tunes a DistilBERT sequence classifier to score text for demographic bias, then probes it with counterfactuals: a spaCy-driven swap engine rewrites names, pronouns, and surnames to generate matched pairs, exposing how much a model's judgment depends on identity rather than content. The system is served through a FastAPI backend with a React frontend, backed by an automated nightly pipeline that regenerates data, retrains, and redeploys the classifier.",
      image: "/projects/project-4.jpg",
      category: "AI/ML",
      tags: ["PyTorch", "DistilBERT", "HuggingFace", "spaCy", "FastAPI", "React"],
      github: "https://github.com/rzarka1298/BiasGPT",
      results: "Automated nightly retrain and deploy"
    },
    {
      id: 5,
      title: "Agentic RAG for IP",
      description: "A Retrieval-Augmented Generation pipeline leveraging Llama Stack to parse, vectorize, and query patent XML files.",
      longDescription: "This project provides high-relevance document retrieval and dynamic, context-driven answers by integrating open-source LLM models and a vector database (AWS) to handle large volumes of patent text. The system enables semantically rich searching and automated patent analysis, changing how intellectual property research is conducted.",
      image: "/projects/llama.png",
      category: "AI/ML",
      tags: ["Python", "llama-stack", "vLLM", "FAISS", "Inference Models"],
      results: "Automated patent analysis pipeline"
    },
    {
      id: 6,
      title: "Neuromaker International Bioengineering Competition",
      description: "Built a prosthetic hand to convert speech to American Sign Language using Google APIs, Python, and RaspberryOS.",
      longDescription: "This project created a prosthetic hand capable of translating spoken language into American Sign Language gestures in real time. Using Google's speech recognition APIs and custom hardware control, the system provides accessibility solutions for the deaf and hard-of-hearing community, demonstrating the intersection of AI, hardware engineering, and social impact.",
      image: "/projects/neuromakerHand.jpeg",
      category: "Hardware",
      tags: ["Google API", "Python", "RaspberryOS", "Hardware Control"],
      results: "International competition recognition"
    },
    {
      id: 7,
      title: "Portfolio Website",
      description: "This site — a personal portfolio built with React, Tailwind, and Framer Motion, with dark mode and a Supabase-backed contact form.",
      longDescription: "This responsive portfolio showcases professional work and technical skills through a modern, clean design. Built with React, TypeScript, and Tailwind CSS, it features smooth Framer Motion animations, class-based dark mode, and a Supabase Edge Function backing the contact form and visitor analytics. Deployed on AWS Amplify.",
      image: "/projects/project-1.jpg",
      category: "Web Dev",
      tags: ["React", "TypeScript", "Tailwind", "Framer Motion", "Supabase", "AWS Amplify"],
      github: "https://github.com/rzarka1298/portfolio",
      demo: "https://main.dv1zd1ccteche.amplifyapp.com/",
      results: "Live on AWS Amplify"
    }
  ];

  // Derive filters from the projects themselves so no filter can render an empty grid
  const filters = ['All', ...Array.from(new Set(projects.map(project => project.category)))];

  const filteredProjects = selectedFilter === 'All'
    ? projects
    : projects.filter(project => project.category === selectedFilter);

  // Load project view counts on component mount
  useEffect(() => {
    // Temporarily disabled to prevent 404 errors
    // Will be re-enabled when API endpoints are fixed
    /*
    const loadProjectViews = async () => {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/projects`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        });
        
        if (response.ok) {
          const { analytics } = await response.json();
          const viewCounts = analytics.reduce((acc: Record<string, number>, item: any) => {
            acc[item.projectId] = item.viewCount;
            return acc;
          }, {});
          setProjectViews(viewCounts);
        }
      } catch (error) {
        console.error('Failed to load project analytics:', error);
      }
    };

    loadProjectViews();
    */
  }, []);

  const trackProjectView = async (project: Project) => {
    // For now, just log project views since we don't have the project-view endpoint
    console.log('📊 Project viewed:', project.title);
    
    // Alternative: Track as a regular visit with project info
    try {
      fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          page: `/project/${project.id}`,
          referrer: 'project-gallery'
        })
      });
    } catch (error) {
      console.error('Failed to track project view:', error);
    }
  };

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl mb-4">Featured Projects</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A showcase of my recent work spanning AI infrastructure, machine learning, and wearable robotics
          </p>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-2 mb-12"
      >
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={selectedFilter === filter ? "default" : "outline"}
            onClick={() => setSelectedFilter(filter)}
            className="text-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {filter}
          </Button>
        ))}
      </motion.div>

      {/* Projects Grid */}
      <motion.div 
        layout
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative overflow-hidden">
                <ImageWithFallback
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {(project.github || project.demo) && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                    {project.github && (
                      <Button size="sm" variant="secondary" asChild>
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          Code
                        </a>
                      </Button>
                    )}
                    {project.demo && (
                      <Button size="sm" asChild>
                        <a href={project.demo} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Demo
                        </a>
                      </Button>
                    )}
                  </div>
                )}
                
                {/* View count */}
                {projectViews[project.id] && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {projectViews[project.id]}
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">
                    {project.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {project.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {project.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-primary">
                    {project.results}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => trackProjectView(project)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{project.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <ImageWithFallback
                          src={project.image}
                          alt={project.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <p className="text-muted-foreground leading-relaxed">
                          {project.longDescription}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {projectViews[project.id] && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Eye className="w-4 h-4 mr-1" />
                            {projectViews[project.id]} views
                          </div>
                        )}
                        {(project.github || project.demo) && (
                          <div className="flex space-x-4 pt-4">
                            {project.github && (
                              <Button asChild>
                                <a href={project.github} target="_blank" rel="noopener noreferrer">
                                  <Github className="w-4 h-4 mr-2" />
                                  View Code
                                </a>
                              </Button>
                            )}
                            {project.demo && (
                              <Button variant="outline" asChild>
                                <a href={project.demo} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Live Demo
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center mt-16"
      >
        <p className="text-lg text-muted-foreground mb-6">
          Want to see more of my work or discuss a potential collaboration?
        </p>
        <Button size="lg" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
          Let's Work Together
        </Button>
      </motion.div>
    </div>
  );
}