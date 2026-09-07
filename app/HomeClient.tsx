"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DailyChecklist from '@/components/dashboard/DailyChecklist';
import ProgressRing from '@/components/dashboard/ProgressRing';
import ContributionCalendar from '@/components/dashboard/ContributionCalendar';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LayoutDashboard, Activity, StickyNote, BrainCircuit, History, BookHeart, Wrench } from 'lucide-react';

export type TaskFrequency = 'once' | 'daily' | 'weekdays' | 'weekends';

export type Task = {
  id: string;
  text: string;
  subject: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  frequency?: TaskFrequency;
};

export type RecurringTaskTemplate = {
  id: string;
  text: string;
  subject: string;
  frequency: TaskFrequency;
};

// Define available shortcuts
const AVAILABLE_SHORTCUTS = [
  { id: 'notes', name: 'Notes', href: '/notes', icon: StickyNote, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { id: 'quiz', name: 'AI Quiz', href: '/quiz', icon: BrainCircuit, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { id: 'history', name: 'History', href: '/history', icon: History, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { id: 'diary', name: 'Diary', href: '/diary', icon: BookHeart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { id: 'tools', name: 'Tools', href: '/tools', icon: Wrench, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
];

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('hub-tasks', []);
  const [recurringTemplates, setRecurringTemplates] = useLocalStorage<RecurringTaskTemplate[]>('hub-recurring-templates', []);
  
  // Widget Visibility & Shortcut State
  const [showProgress, setShowProgress] = useLocalStorage('hub-show-progress', true);
  const [showActivity, setShowActivity] = useLocalStorage('hub-show-activity', true);
  const [pinnedShortcuts, setPinnedShortcuts] = useLocalStorage<string[]>('hub-pinned-shortcuts', ['notes', 'quiz']); // Default defaults
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // --- Dynamic Greeting Logic ---
  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 18) {
      timeGreeting = 'Good afternoon';
    }
    
    setGreeting(`${timeGreeting}!`);
  }, []);

  // --- Auto-generate today's recurring tasks on load ---
  useEffect(() => {
    if (!recurringTemplates || recurringTemplates.length === 0) return;

    const dayOfWeek = new Date().getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const activeTemplates = recurringTemplates.filter(template => {
      if (template.frequency === 'daily') return true;
      if (template.frequency === 'weekdays') return !isWeekend;
      if (template.frequency === 'weekends') return isWeekend;
      return false;
    });

    setTasks(prevTasks => {
      const todayTasks = prevTasks.filter(t => t.date === todayStr);
      const existingTaskTexts = new Set(todayTasks.map(t => t.text.toLowerCase()));

      const newTasksForToday: Task[] = activeTemplates
        .filter(template => !existingTaskTexts.has(template.text.toLowerCase()))
        .map(template => ({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: template.text,
          subject: template.subject,
          completed: false,
          date: todayStr,
          frequency: template.frequency,
        }));

      if (newTasksForToday.length === 0) return prevTasks;
      return [...prevTasks, ...newTasksForToday];
    });
  }, [recurringTemplates, todayStr, setTasks]);

  const todaysTasks = tasks.filter(t => t.date === todayStr);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = (text: string, subject: string, frequency: TaskFrequency = 'once') => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      subject,
      completed: false,
      date: todayStr,
      frequency,
    };

    if (frequency !== 'once') {
      const newTemplate: RecurringTaskTemplate = {
        id: Date.now().toString(),
        text,
        subject,
        frequency,
      };
      setRecurringTemplates(prev => [...prev, newTemplate]);
    }

    setTasks(prev => [...prev, newTask]);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);

    if (taskToDelete?.frequency && taskToDelete.frequency !== 'once') {
      setRecurringTemplates(prev =>
        prev.filter(t => t.text.toLowerCase() !== taskToDelete.text.toLowerCase())
      );
    }

    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleShortcut = (id: string) => {
    if (pinnedShortcuts.includes(id)) {
      setPinnedShortcuts(pinnedShortcuts.filter(s => s !== id));
    } else {
      setPinnedShortcuts([...pinnedShortcuts, id]);
    }
  };

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Math', 'Science', 'Aptitude', 'Coding', 'English', 'History', 'Geography');

  const completedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const activityData = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (task.completed) {
        acc[task.date] = (acc[task.date] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

  const isRightColumnVisible = showProgress || showActivity;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
      <header className="mb-6 sm:mb-8 min-h-[4rem] flex justify-between items-start relative z-40">
        <div>
          {/* Animated Greeting */}
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white"
          >
            {greeting || 'The Hub'}
          </motion.h1>
          
          {/* Animated Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-slate-500 mt-2 text-sm sm:text-base font-medium"
          >
            Your daily command center.
          </motion.p>

          {/* Render Pinned Shortcuts directly in the Hub */}
          {pinnedShortcuts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 sm:gap-3 mt-4"
            >
              <AnimatePresence>
                {AVAILABLE_SHORTCUTS.filter(s => pinnedShortcuts.includes(s.id)).map(shortcut => (
                  <motion.div
                    key={shortcut.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link 
                      href={shortcut.href} 
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:scale-105 hover:shadow-sm border border-transparent hover:border-current/10 ${shortcut.bg} ${shortcut.color}`}
                    >
                      <shortcut.icon size={16} />
                      {shortcut.name}
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Settings Toggle & Dropdown */}
        <div className="relative shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2.5 rounded-xl transition-colors ${
              isSettingsOpen 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            <Settings size={20} />
          </motion.button>

          <AnimatePresence>
            {isSettingsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dashboard Layout</h3>
                    
                    <label className="flex items-center justify-between cursor-pointer mb-3 group">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <LayoutDashboard size={16} /> Progress Ring
                      </span>
                      <input 
                        type="checkbox" 
                        checked={showProgress} 
                        onChange={(e) => setShowProgress(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <Activity size={16} /> Activity Log
                      </span>
                      <input 
                        type="checkbox" 
                        checked={showActivity} 
                        onChange={(e) => setShowActivity(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="p-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2 pt-2">Pin Shortcuts</h3>
                    {AVAILABLE_SHORTCUTS.map(shortcut => (
                      <button
                        key={shortcut.id}
                        onClick={() => toggleShortcut(shortcut.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <shortcut.icon size={16} /> {shortcut.name}
                        </span>
                        <input 
                          type="checkbox" 
                          checked={pinnedShortcuts.includes(shortcut.id)} 
                          readOnly 
                          className="w-4 h-4 accent-indigo-500 rounded pointer-events-none" 
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Animated Main Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={isRightColumnVisible ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <DailyChecklist
            tasks={todaysTasks}
            existingSubjects={uniqueSubjects}
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
          />
        </motion.div>

        {/* Animated Sidebar Column */}
        <AnimatePresence>
          {isRightColumnVisible && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 20, width: 0, overflow: 'hidden' }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="lg:col-span-1 lg:sticky lg:top-8 flex flex-col gap-6"
            >
              {showProgress && <ProgressRing percentage={progressPercentage} />}
              
              {showActivity && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                >
                  <ContributionCalendar data={activityData} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}