import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Send, Download, CheckCircle, Instagram } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/server/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Message sent successfully! I'll get back to you soon.", {
          description: "Thank you for reaching out. I typically respond within 24 hours."
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });

        console.log('📧 Contact form submitted:', { id: result.id });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error("Failed to send message", {
        description: "Please try again or reach out via email directly."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadResume = () => {
    // Track resume download
    try {
      fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        },
        body: JSON.stringify({
          page: '/resume-download',
          referrer: 'contact-form'
        })
      });
    } catch (error) {
      console.error('Failed to track resume download:', error);
    }
    
    // Download resume
    const link = document.createElement('a');
    link.href = './assets/Zarkar_Rugved_Resume.pdf';
    link.download = 'Rugved_Zarkar_Resume.pdf';
    link.click();
    
    toast.success("Resume downloaded successfully!");
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
      value: "rugvedzarkar@gmail.com",
      href: "mailto:rugvedzarkar@gmail.com"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Phone",
      value: "443-567-0781",
      href: "tel:443-567-0781"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Location",
      value: "Clarksville, MD",
      href: null
    }
  ];

  const socialLinks = [
    {
      name: "GitHub",
      icon: <Github className="w-6 h-6" />,
      href: "https://github.com/rzarka1298",
      color: "hover:text-gray-900 dark:hover:text-gray-100"
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-6 h-6" />,
      href: "https://www.linkedin.com/in/rugved-zarkar-96878b2a4",
      color: "hover:text-blue-600"
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-6 h-6" />,
      href: "https://www.instagram.com/rugvedzarkar/",
      color: "hover:text-blue-400"
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
          <h2 className="text-4xl md:text-5xl mb-4">Let's Work Together</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a project in mind? I'd love to hear from you. Send me a message and let's start building something amazing.
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Mail className="w-6 h-6 mr-3 text-primary" />
                Send me a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                      className="transition-all duration-300 focus:scale-105"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                    className="transition-all duration-300 focus:scale-105"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell me about your project or idea..."
                    className="transition-all duration-300 focus:scale-105 resize-none"
                  />
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info & Social Links */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-8"
        >
          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Get in touch</CardTitle>
              <p className="text-muted-foreground">
                Feel free to reach out through any of these channels
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + (0.1 * index) }}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-300"
                >
                  <div className="text-primary">{info.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="hover:text-primary transition-colors duration-200"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p>{info.value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Find me online</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.8 + (0.1 * index),
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 bg-muted rounded-full text-muted-foreground transition-all duration-300 ${social.color}`}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resume Download */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl mb-3">Interested in my experience?</h3>
                <p className="text-muted-foreground mb-6">
                  Download my resume to learn more about my background and projects
                </p>
                <Button
                  onClick={downloadResume}
                  size="lg"
                  variant="outline"
                  className="group"
                >
                  <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Download Resume
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fun Easter Egg */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20"
          >
            <div className="text-2xl mb-2">🤖</div>
            <p className="text-sm text-muted-foreground">
              <strong>Fun fact:</strong> I'm currently working on wearable robotics! 
              Feel free to ask me about my latest research projects.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Response Promise */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="mt-16 text-center"
      >
        <div className="flex items-center justify-center space-x-2 text-primary mb-4">
          <CheckCircle className="w-5 h-5" />
          <span>Quick Response Guaranteed</span>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          I typically respond to all inquiries within 24 hours. Looking forward to hearing from you!
        </p>
      </motion.div>
    </div>
  );
}