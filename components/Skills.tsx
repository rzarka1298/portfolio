import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, Database, Brain, Wrench, BookOpen, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const skillCategories = [
    {
      name: "Programming Languages",
      icon: <Code2 className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      skills: [
        { name: "Python" },
        { name: "Java" },
        { name: "JavaScript" },
        { name: "TypeScript" },
        { name: "C++" },
        { name: "HTML/CSS" }
      ]
    },
    {
      name: "Web Development",
      icon: <Database className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      skills: [
        { name: "React" },
        { name: "Node.js" },
        { name: "Next.js" },
        { name: "Tailwind CSS" },
        { name: "MongoDB" },
        { name: "PostgreSQL" }
      ]
    },
    {
      name: "AI/ML & Data Science",
      icon: <Brain className="w-6 h-6" />,
      color: "from-teal-500 to-green-500",
      skills: [
        { name: "llama-stack" },
        { name: "vLLM" },
        { name: "FAISS" },
        { name: "SKLearn" },
        { name: "Random Forest" },
        { name: "Data Analysis" }
      ]
    },
    {
      name: "Hardware & Robotics",
      icon: <Wrench className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      skills: [
        { name: "Arduino" },
        { name: "RaspberryOS" },
        { name: "Hardware Design" },
        { name: "PLC Programming" },
        { name: "Ladder Logic" },
        { name: "CVD Systems" }
      ]
    },
    {
      name: "Development Tools",
      icon: <Settings className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      skills: [
        { name: "Git/GitHub" },
        { name: "MATLAB" },
        { name: "AWS" },
        { name: "Google APIs" },
        { name: "Docker" },
        { name: "Linux" }
      ]
    },
    {
      name: "Research & Analytics",
      icon: <BookOpen className="w-6 h-6" />,
      color: "from-indigo-500 to-blue-500",
      skills: [
        { name: "Patent Analysis" },
        { name: "Statistical Analysis" },
        { name: "Research Methods" },
        { name: "Technical Writing" },
        { name: "Data Visualization" }
      ]
    }
  ];

  const allSkills = skillCategories.flatMap(category => 
    category.skills.map(skill => ({
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
          {allSkills.slice(0, 20).map((skill, index) => (
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