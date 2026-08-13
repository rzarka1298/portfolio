import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, Globe, Brain, Cloud, Award, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const skillCategories = [
    {
      name: "Languages",
      icon: <Code2 className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      skills: [
        { name: "Python" },
        { name: "Java" },
        { name: "TypeScript" },
        { name: "JavaScript" },
        { name: "Go" },
        { name: "SQL" },
        { name: "C" },
        { name: "C++" },
        { name: "MATLAB" },
        { name: "HTML/CSS" }
      ]
    },
    {
      name: "AI & Machine Learning",
      icon: <Brain className="w-6 h-6" />,
      color: "from-teal-500 to-green-500",
      skills: [
        { name: "PyTorch" },
        { name: "TensorFlow" },
        { name: "Scikit-Learn" },
        { name: "HuggingFace" },
        { name: "LangChain" },
        { name: "llama-index" },
        { name: "Weaviate" },
        { name: "FAISS" },
        { name: "Diffusion Models" }
      ]
    },
    {
      name: "Cloud & Infrastructure",
      icon: <Cloud className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      skills: [
        { name: "AWS" },
        { name: "Docker" },
        { name: "Linux" },
        { name: "Terraform" },
        { name: "Ansible" },
        { name: "Temporal" },
        { name: "DNSDist" },
        { name: "Unbound" },
        { name: "Grafana" }
      ]
    },
    {
      name: "Web & Frameworks",
      icon: <Globe className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      skills: [
        { name: "React.js" },
        { name: "Node.js" },
        { name: "FastAPI" },
        { name: "Tailwind CSS" },
        { name: "REST APIs" },
        { name: "MySQL" },
        { name: "Supabase" }
      ]
    },
    {
      name: "Developer Tools",
      icon: <Settings className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      skills: [
        { name: "Git" },
        { name: "GitHub" },
        { name: "Bash" },
        { name: "OpenTelemetry" },
        { name: "Vite" },
        { name: "systemd" }
      ]
    },
    {
      name: "Certifications",
      icon: <Award className="w-6 h-6" />,
      color: "from-indigo-500 to-blue-500",
      skills: [
        { name: "AWS Certified Cloud Practitioner" },
        { name: "AWS Solutions Architect" },
        { name: "Autodesk Fusion Certified" }
      ]
    }
  ];

  // Take a few from each category so the stack cloud stays representative rather than
  // showing only whichever categories happen to be listed first. Certifications are
  // excluded — their names are too long to read well as pills.
  const featuredSkills = skillCategories
    .filter(category => category.name !== 'Certifications')
    .flatMap(category =>
      category.skills.slice(0, 4).map(skill => ({
        ...skill,
        category: category.name,
        color: category.color
      }))
    );

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl mb-4">Skills & Technologies</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of my technical expertise and experience
          </p>
        </motion.div>
      </div>

      {/* Category Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {skillCategories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            className="transition-all duration-300"
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${category.color} text-white`}>
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill.name} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                  {category.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.skills.length - 4} more
                    </Badge>
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {category.skills.length} technologies
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Skill Cloud Animation */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-16 text-center"
      >
        <h3 className="text-2xl mb-8">Technology Stack</h3>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {featuredSkills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ 
                duration: 0.5, 
                delay: 0.8 + (0.05 * index),
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ scale: 1.1 }}
              className={`px-4 py-2 rounded-full bg-gradient-to-r ${skill.color} text-white text-sm font-medium shadow-lg`}
            >
              {skill.name}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}