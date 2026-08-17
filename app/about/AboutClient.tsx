"use client";

import React from 'react';
import { motion, SegmentValueTransitionOptions, Variants } from 'framer-motion';
import { FaGithub, FaLinkedin  } from "react-icons/fa";
import { Sparkles, Info, Target, Code2, Zap, Shield, Heart, Laptop, Globe } from 'lucide-react';

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function AboutPage() {
  const developers = [
    {
      name: "Piyush Burnwal",
      role: "Full-Stack Developer",
      initials: "PB",
      bio: "Crafting tools that solve real problems. When I'm not pushing code, hitting the books, or optimizing web performance, I'm out hitting the pavement for a run to keep the balance.",
      links: {
        github: "https://github.com/piyushbrl69",
        linkedin: "https://www.linkedin.com/in/piyushbrl", // Add your LinkedIn URL here
        portfolio: "https://piyush-portfolio-black.vercel.app/" // Add your Portfolio URL here
      }
    },
    {
      name: "Anjali Pandey", // Replace with second dev's name
      role: "Frontend Developer / Designer", // Replace with their role
      initials: "AP", // Replace with their initials
      bio: "Passionate about creating beautiful, intuitive user interfaces and seamless experiences. Focused on turning complex data into clean, accessible design.", // Replace with their bio
      links: {
        github: "https://github.com/anjali-pandey-28", // Add their GitHub URL here
        linkedin: "https://www.linkedin.com/in/anjalipandey0728/", // Add their LinkedIn URL here
        portfolio: "https://anjalip.vercel.app/" // Add their Portfolio URL here
      }
    }
  ];

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 sm:space-y-12 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      
      {/* Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Info className="text-indigo-500 shrink-0" size={32} />
          About Lume
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">The philosophy and technology behind your study command center.</p>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        
        {/* Top Section: Mission & Tech Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Mission Card */}
          <motion.section variants={itemVariants} className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <Target size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">The Ultimate Study App</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Lume was built out of a personal need for a distraction-free, lightning-fast environment to manage intense study routines. Whether you're tracking daily university assignments, reviewing massive flashcard decks, or logging deep focus hours for competitive exams, Lume is designed to keep you locked in and moving forward.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Zap className="text-emerald-500" size={18} /> Lightning Fast
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Shield className="text-rose-500" size={18} /> Local First & Private
                </div>
              </div>
            </div>
          </motion.section>

          {/* Tech Stack Card */}
          <motion.section variants={itemVariants} className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Laptop size={16} /> Built With
            </h3>
            
            <div className="flex flex-wrap gap-2 flex-1 content-start">
              {['Next.js 16', 'React', 'Tailwind CSS v4', 'Framer Motion', 'TypeScript', 'IndexedDB', 'Lucide Icons'].map((tech) => (
                <span 
                  key={tech} 
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors hover:border-indigo-300 dark:hover:border-indigo-700 cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Bottom Section: The Developers */}
        <div>
          <motion.h3 variants={itemVariants} className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Code2 className="text-indigo-500" size={24} />
            Meet the Developers
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {developers.map((dev, index) => (
              <motion.section 
                key={index}
                variants={itemVariants} 
                className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-1 shadow-lg group hover:shadow-indigo-500/20 transition-shadow duration-300"
              >
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[22px] h-full flex flex-col relative overflow-hidden">
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl font-black text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {dev.initials}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white">{dev.name}</h4>
                      <p className="text-sm text-slate-500 font-medium">{dev.role}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-8 flex-1 relative z-10">
                    {dev.bio}
                  </p>

                  {/* Social Links */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      aria-label={`${dev.name}'s GitHub`}
                    >
                      <FaGithub size={18} />
                    </motion.a>
                    
                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      aria-label={`${dev.name}'s LinkedIn`}
                    >
                      <FaLinkedin size={18} />
                    </motion.a>

                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      aria-label={`${dev.name}'s Portfolio`}
                    >
                      <Globe size={18} />
                    </motion.a>
                  </div>

                </div>
              </motion.section>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <motion.div variants={itemVariants} className="text-center pt-8 pb-4 opacity-60">
          <p className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1">
            Made with <Heart size={12} className="text-rose-500 fill-rose-500" /> for students everywhere.
          </p>
        </motion.div>

      </motion.div>
    </main>
  );
}