"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  HelpCircle, LayoutDashboard, Library, BookA, 
  StickyNote, Timer, History, Wrench, Bug, MessageSquare, ArrowRight, ShieldAlert, ChevronDown 
} from 'lucide-react';

// --- Animation Variants ---
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

const accordionVariants: Variants = {
  expanded: { 
    opacity: 1, 
    height: "auto",
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  collapsed: { 
    opacity: 0, 
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

export default function HelpPage() {
  // State to track which section is currently open (null means all closed)
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const helpSections = [
    {
      title: "The Hub",
      icon: <LayoutDashboard size={24} />,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      description: "Your daily command center for task management.",
      features: [
        "Create one-off or recurring daily/weekly missions.",
        "Track your daily study streaks by completing all tasks.",
        "Categorize tasks by subject for a clear overview.",
        "Watch your progress ring fill up as you check off items."
      ]
    },
    {
      title: "Flashcards",
      icon: <Library size={24} />,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      description: "Master any subject using active recall.",
      features: [
        "Create custom decks for different subjects or exams.",
        "Test your knowledge by flipping cards and grading your memory.",
        "Cards are stored completely locally for zero loading times."
      ]
    },
    {
      title: "Vocabulary Arsenal",
      icon: <BookA size={24} />,
      color: "text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      description: "Build and retain a powerful vocabulary.",
      features: [
        "Log new words, their meanings, and example sentences.",
        "Filter and search through your arsenal instantly.",
        "Perfect for language learning or improving communication fluency."
      ]
    },
    {
      title: "Notes",
      icon: <StickyNote size={24} />,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      description: "Your digital notebook for lectures and ideas.",
      features: [
        "Write and format rich-text study notes.",
        "Securely store image attachments locally via IndexedDB.",
        "Organize notes by subject or date."
      ]
    },
    {
      title: "Deep Focus",
      icon: <Timer size={24} />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      description: "Time-blocking tool to maximize concentration.",
      features: [
        "Use Pomodoro-style intervals (e.g., 25m focus, 5m break).",
        "Set custom timer durations for intense study sessions.",
        "Visual charts track exactly how many minutes you study each day.",
        "Break times are intelligently excluded from your study analytics."
      ]
    },
    {
      title: "History & Analytics",
      icon: <History size={24} />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
      description: "Review your past performance and habits.",
      features: [
        "Look back at completed tasks and study logs.",
        "Identify patterns in your productivity across different days."
      ]
    },
    {
      title: "Tools & Data Management",
      icon: <Wrench size={24} />,
      color: "text-slate-500",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      description: "Manage your workspace and secure your data.",
      features: [
        "Save quick-access bookmarks (like ChatGPT, LeetCode, or YouTube).",
        "Export a complete JSON backup of all your tasks, notes, and attachments.",
        "Restore your setup instantly on a new device using the backup file."
      ]
    }
  ];

  const linkedInUrl = "https://www.linkedin.com/in/piyushbrl/"; 

  const toggleSection = (idx: number) => {
    setExpandedSection(expandedSection === idx ? null : idx);
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors max-w-4xl mx-auto">
      
      {/* Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <HelpCircle className="text-indigo-500 shrink-0" size={32} />
          Help & Documentation
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Everything you need to know to master Lume.</p>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        
        {/* Suggestion / Bug Report CTA (Moved to Top for instant visibility) */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            
            <div className="absolute -top-12 -right-4 text-white/5 rotate-12 pointer-events-none">
              <Bug size={160} />
            </div>

            <div className="relative z-10 flex-1">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                <MessageSquare className="text-indigo-400" size={22} />
                Report a Bug or Suggest a Feature
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Lume is constantly evolving. If you have a feature request or ran into an unexpected issue, let me know!
              </p>
            </div>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="relative z-10 shrink-0 w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/25"
            >
              Message on LinkedIn
              <ArrowRight size={18} />
            </motion.a>
            
          </div>
        </motion.section>

        {/* Important Privacy Note */}
        <motion.div variants={itemVariants} className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="text-indigo-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Privacy First Approach</h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
              Lume operates entirely on your local device. Your tasks, notes, and study times are never sent to a central server. Remember to regularly export your data in the <strong>Tools</strong> section to prevent accidental data loss!
            </p>
          </div>
        </motion.div>

        {/* Interactive Expandable Features Accordion */}
        <motion.section variants={itemVariants} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-1">Explore Features</h2>
          
          {helpSections.map((section, idx) => {
            const isExpanded = expandedSection === idx;

            return (
              <div 
                key={idx}
                className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-colors ${
                  isExpanded 
                    ? 'border-indigo-300 dark:border-indigo-700 shadow-sm' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <button 
                  onClick={() => toggleSection(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.bgColor} ${section.color}`}>
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">{section.title}</h3>
                      {!isExpanded && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <motion.div 
                    animate={{ rotate: isExpanded ? 180 : 0 }} 
                    className="text-slate-400 shrink-0 ml-4"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      variants={accordionVariants}
                    >
                      <div className="px-4 pb-5 sm:px-5 sm:pb-6 ml-0 sm:ml-[4.5rem]">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                          {section.description}
                        </p>
                        <ul className="space-y-2.5">
                          {section.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.section>

      </motion.div>
    </main>
  );
}