import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, MapPin, Award, TrendingUp, Users, Code } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const experiences = [
    {
      id: 1,
      title: "Research Assistant",
      company: "UMDCS SmartLabs",
      location: "University of Maryland",
      period: "Aug 2024 - Present",
      type: "Research",
      description: "Developing interactive touchscreen technology for Calico, a miniature relocatable wearable system with fast and precise locomotion for on-body interaction, actuation, and sensing.",
      achievements: [
        "Working to implement AI to allow robots to sense human host actions",
        "Developing systems to display related statistics and feedback",
        "Contributing to cutting-edge wearable robotics research",
        "Collaborating with interdisciplinary research team"
      ],
      technologies: ["Python", "C++", "Arduino", "Hardware Design", "AI/ML"],
      icon: <Code className="w-5 h-5" />
    },
    {
      id: 2,
      title: "Software Engineer Intern",
      company: "Aspire JHU APL",
      location: "Johns Hopkins Applied Physics Laboratory",
      period: "May 2023 - May 2024",
      type: "Internship",
      description: "Utilized Matlab, Python, and Github to develop a production-level application to track inventory. Led 10 intern developers throughout app development lifecycle.",
      achievements: [
        "Led team of 10 intern developers with meetings and deadlines",
        "Developed production-level inventory tracking application",
        "Presented findings to APL Air Missile Defense Sector administration",
        "Surveyed employees for user preferences on SAILS app"
      ],
      technologies: ["MATLAB", "Python", "Github", "Team Leadership"],
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 3,
      title: "Junior Developer",
      company: "Neuron-G",
      location: "Remote",
      period: "May 2022 - Sept 2022",
      type: "Contract",
      description: "Conducted research study to determine the extent of bias in Supreme Court cases using machine learning techniques and statistical analysis.",
      achievements: [
        "Used SKLearn's Random Forest to capture feature importance",
        "Analyzed demographic variables including race, gender, and age",
        "Contributed to bias detection research in judicial systems",
        "Developed data analysis pipelines for legal research"
      ],
      technologies: ["SKLearn", "Random Forest", "Python", "Github", "Data Analysis"],
      icon: <Award className="w-5 h-5" />
    },
    {
      id: 4,
      title: "Research and Development Intern",
      company: "BlueWave Semiconductors",
      location: "On-site",
      period: "May 2020 - Aug 2022",
      type: "Internship",
      description: "Led implementation of automated remote monitoring systems for semiconductor manufacturing equipment, which proved especially valuable during the pandemic.",
      achievements: [
        "Implemented automated remote monitoring for CVD System",
        "Automated Substrate heaters and Thermal Evaporator Deposition Systems",
        "Used PLC circuitry programming and sensors for automation",
        "Enabled remote depositions during pandemic restrictions"
      ],
      technologies: ["CVD", "PLC Programming", "Ladder Logic", "Industrial Automation"],
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl mb-4">Professional Experience</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            My journey through different roles, companies, and the impact I've made along the way
          </p>
        </motion.div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />

        <div className="space-y-12">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="relative"
            >
              {/* Timeline Dot */}
              <div className="absolute left-6 w-4 h-4 bg-primary rounded-full border-4 border-background shadow-lg hidden md:block" />
              
              <div className="md:ml-16">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="bg-primary/10 p-2 rounded-lg mr-3 text-primary">
                            {exp.icon}
                          </div>
                          <div>
                            <h3 className="text-2xl mb-1">{exp.title}</h3>
                            <p className="text-lg text-primary">{exp.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {exp.period}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {exp.location}
                          </div>
                          <Badge variant="secondary">{exp.type}</Badge>
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {exp.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Achievements */}
                      <div>
                        <h4 className="mb-3 flex items-center">
                          <Award className="w-4 h-4 mr-2 text-primary" />
                          Key Achievements
                        </h4>
                        <ul className="space-y-2">
                          {exp.achievements.map((achievement, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={isInView ? { opacity: 1, x: 0 } : {}}
                              transition={{ duration: 0.5, delay: 0.2 + (0.1 * i) }}
                              className="flex items-start text-sm text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 shrink-0" />
                              {achievement}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Technologies */}
                      <div>
                        <h4 className="mb-3 flex items-center">
                          <Code className="w-4 h-4 mr-2 text-primary" />
                          Technologies Used
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {exp.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="mt-16 text-center"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
          {[
            { number: "4+", label: "Years Experience" },
            { number: "4", label: "Research Projects" },
            { number: "10+", label: "Technologies" },
            { number: "3", label: "Leadership Roles" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.9 + (0.1 * index), type: "spring" }}
            >
              <div className="text-3xl text-primary mb-1">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}