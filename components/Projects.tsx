import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Github, ExternalLink, Play, Filter, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function Projects() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [projectViews, setProjectViews] = useState<Record<string, number>>({});
  
  const filters = ['All', 'AI/ML', 'Web Dev', 'Hardware', 'Research'];
  
  const projects = [
    {
      id: 1,
      title: "Agentic RAG for IP",
      description: "Developing a Retrieval-Augmented Generation (RAG) pipeline leveraging Llama Stack to parse, vectorize, and query patent XML files.",
      longDescription: "This project provides high-relevance document retrieval and dynamic, context-driven answers by integrating open-source LLM models and a vector database (AWS) to handle large volumes of patent text. The system enables semantically rich searching and automated patent analysis, revolutionizing how intellectual property research is conducted.",
      image: "../assets/projects/llama.png",
      category: "AI/ML",
      tags: ["Python", "llama-stack", "vLLM", "FAISS", "Inference Models"],
      github: "https://github.com",
      demo: "https://demo.com",
      results: "Automated patent analysis pipeline"
    },
    {
      id: 2,
      title: "Calico Smartlabs",
      description: "A fully functional miniature relocatable wearable system with fast and precise locomotion for on-body interaction, actuation, and sensing.",
      longDescription: "This cutting-edge research project involves creating a miniature robot that can move around on the human body while providing interactive touchscreen capabilities. The system uses advanced sensors and AI to understand user actions and provide real-time feedback, representing a breakthrough in wearable robotics technology.",
      image: "../assets/projects/calico.png",
      category: "Hardware",
      tags: ["Python", "C++", "Arduino", "Hardware Design", "UI Development"],
      github: "https://github.com",
      demo: "https://demo.com",
      results: "Breakthrough in wearable robotics"
    },
    {
      id: 3,
      title: "Neuromaker International Bioengineering Competition",
      description: "Built a prosthetic hand to convert speech to American Sign Language using Google APIs, Python, and RaspberryOS.",
      longDescription: "This innovative project created a prosthetic hand capable of translating spoken language into American Sign Language gestures in real-time. Using Google's speech recognition APIs and custom hardware control, the system provides accessibility solutions for the deaf and hard-of-hearing community. The project demonstrates the intersection of AI, hardware engineering, and social impact.",
      image: "../assets/projects/neuromakerHand.jpeg",
      category: "Hardware",
      tags: ["Google API", "Python", "RaspberryOS", "Hardware Control"],
      github: "https://github.com",
      demo: "https://demo.com",
      results: "International competition recognition"
    },
    {
      id: 4,
      title: "Portfolio Website",
      description: "A personal portfolio website showcasing projects, skills, and contact information with modern web technologies.",
      longDescription: "This responsive portfolio website showcases professional work and technical skills through a modern, clean design. Built with React and Tailwind CSS, it features smooth animations, dark mode support, and optimized performance. The site serves as both a portfolio piece and a demonstration of front-end development capabilities.",
      image: "../assets/projects/project-1.jpg",
      category: "Web Dev",
      tags: ["HTML", "CSS", "React", "Tailwind"],
      github: "https://github.com",
      demo: "https://demo.com",
      results: "Professional online presence"
    }
  ];

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

  const trackProjectView = async (project: typeof projects[0]) => {
    // Temporarily disabled to prevent 404 errors
    console.log('Project viewed:', project.title);
    /*
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/project-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          projectId: project.id.toString(),
          projectTitle: project.title
        })
      });

      if (response.ok) {
        const { viewCount } = await response.json();
        setProjectViews(prev => ({
          ...prev,
          [project.id]: viewCount
        }));
      }
    } catch (error) {
      console.error('Failed to track project view:', error);
    }
    */
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
            A showcase of my recent work spanning web development, AI/ML, and user experience design
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                  <Button size="sm" variant="secondary" asChild>
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      Code
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={project.demo} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Demo
                    </a>
                  </Button>
                </div>
                
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
                        <div className="flex space-x-4 pt-4">
                          <Button asChild>
                            <a href={project.github} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4 mr-2" />
                              View Code
                            </a>
                          </Button>
                          <Button variant="outline" asChild>
                            <a href={project.demo} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Live Demo
                            </a>
                          </Button>
                        </div>
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