"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DailyChecklist from '@/components/dashboard/DailyChecklist';
import ProgressRing from '@/components/dashboard/ProgressRing';
import ContributionCalendar from '@/components/dashboard/ContributionCalendar';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, LayoutDashboard, Activity, StickyNote,Library, BookA, BrainCircuit, 
  History, BookHeart, Wrench, Target, Flag, AlertTriangle, X 
} from 'lucide-react';

export type TaskFrequency = 'once' | 'daily' | 'weekdays' | 'weekends';

export type Task = {
  id: string;
  text: string;
  subject: string;
  completed: boolean;
  date: string;
  frequency?: TaskFrequency;
};

export type RecurringTaskTemplate = {
  id: string;
  text: string;
  subject: string;
  frequency: TaskFrequency;
};

export type ExamGoal = {
  name: string;
  targetDate: string;
  createdAt: string; 
};

const AVAILABLE_SHORTCUTS = [
  { id: 'notes', name: 'Notes', href: '/notes', icon: StickyNote, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { id: 'quiz', name: 'AI Quiz', href: '/quiz', icon: BrainCircuit, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { id: 'history', name: 'History', href: '/history', icon: History, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { id: 'diary', name: 'Diary', href: '/diary', icon: BookHeart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { id: 'vocab', name: 'Vocab', href: '/vocab', icon: BookA, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
  { id: 'flashcards', name: 'FlashCards', href: '/flashcards', icon: Library, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  { id: 'tools', name: 'Tools', href: '/tools', icon: Wrench, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
];

const EXAM_PRESETS = [
  { id: 'gate', name: 'GATE CS/IT', date: '2027-02-06' },
  { id: 'afcat', name: 'AFCAT 1', date: '2027-02-20' },
  { id: 'cds', name: 'CDS 1', date: '2027-04-18' },
];

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('hub-tasks', []);
  const [recurringTemplates, setRecurringTemplates] = useLocalStorage<RecurringTaskTemplate[]>('hub-recurring-templates', []);
  
  const [showProgress, setShowProgress] = useLocalStorage('hub-show-progress', true);
  const [showActivity, setShowActivity] = useLocalStorage('hub-show-activity', true);
  const [pinnedShortcuts, setPinnedShortcuts] = useLocalStorage<string[]>('hub-pinned-shortcuts', ['notes', 'quiz']);
  const [examGoal, setExamGoal] = useLocalStorage<ExamGoal | null>('hub-exam-goal', null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [coachAlert, setCoachAlert] = useState<string | null>(null);

  const [goalName, setGoalName] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    
    setGreeting(`${timeGreeting}!`);

    const currentTasks = tasks.filter(t => t.date === todayStr);
    const total = currentTasks.length;
    const completed = currentTasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : (completed / total) * 100;

    if (total > 0) {
      if (hour >= 12 && hour < 18 && completed === 0) {
        setCoachAlert("Half the day is gone. Complete your first mission!");
      } else if (hour >= 18 && hour < 21 && progress <= 40) {
        setCoachAlert("Evening's here. Lock in and clear remaining tasks.");
      } else if (hour >= 21 && progress < 100) {
        setCoachAlert(`Late night grind? ${total - completed} tasks left to wrap up.`);
      } else {
        setCoachAlert(null);
      }
    } else {
      setCoachAlert(null);
    }
  }, [tasks, todayStr]);

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
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const addTask = (text: string, subject: string, frequency: TaskFrequency = 'once') => {
    const newTask: Task = { 
      id: Date.now().toString(), 
      text, 
      subject, 
      completed: false, 
      date: todayStr, 
      frequency 
    };

    if (frequency !== 'once') {
      setRecurringTemplates(prev => [...prev, { id: Date.now().toString(), text, subject, frequency }]);
    }
    setTasks(prev => [...prev, newTask]);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete?.frequency && taskToDelete.frequency !== 'once') {
      setRecurringTemplates(prev => prev.filter(t => t.text.toLowerCase() !== taskToDelete.text.toLowerCase()));
    }
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleShortcut = (id: string) => {
    if (pinnedShortcuts.includes(id)) setPinnedShortcuts(pinnedShortcuts.filter(s => s !== id));
    else setPinnedShortcuts([...pinnedShortcuts, id]);
  };

  const saveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalDate) return;
    setExamGoal({ name: goalName, targetDate: goalDate, createdAt: todayStr });
    setIsGoalModalOpen(false);
  };

  const applyPreset = (preset: typeof EXAM_PRESETS[0]) => {
    setGoalName(preset.name);
    setGoalDate(preset.date);
  };

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Math', 'Science', 'Aptitude', 'Coding', 'English', 'History', 'Geography');

  const completedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const activityData = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (task.completed) acc[task.date] = (acc[task.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

  const isRightColumnVisible = showProgress || showActivity;

  let daysLeft = 0;
  let goalProgress = 0;
  if (examGoal) {
    try {
      const target = parseISO(examGoal.targetDate);
      const start = parseISO(examGoal.createdAt);
      daysLeft = Math.max(0, differenceInDays(target, new Date()));
      const totalDuration = Math.max(1, differenceInDays(target, start));
      goalProgress = Math.max(0, Math.min(100, ((totalDuration - daysLeft) / totalDuration) * 100));
    } catch (e) {
      console.error("Date parsing error", e);
    }
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
      {examGoal && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
          onClick={() => { setGoalName(examGoal.name); setGoalDate(examGoal.targetDate); setIsGoalModalOpen(true); }}
        >
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-1/3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Goal</p>
                <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">{examGoal.name}</h2>
              </div>
            </div>
            <div className="text-right sm:hidden">
              <span className="text-2xl font-black text-indigo-500">{daysLeft}</span>
              <span className="text-xs font-bold text-slate-400 block -mt-1">DAYS</span>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full"
              />
            </div>
          </div>

          <div className="hidden sm:block text-right shrink-0">
            <span className="text-2xl font-black text-indigo-500">{daysLeft}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">DAYS TO GO</span>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {coachAlert && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                {coachAlert}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-6 sm:mb-8 min-h-[4rem] flex justify-between items-start relative z-30">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white"
          >
            {greeting || 'The Hub'}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-slate-500 mt-2 text-sm sm:text-base font-medium"
          >
            Your daily command center.
          </motion.p>

          {pinnedShortcuts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 sm:gap-3 mt-4"
            >
              <AnimatePresence>
                {AVAILABLE_SHORTCUTS.filter(s => pinnedShortcuts.includes(s.id)).map(shortcut => (
                  <motion.div key={shortcut.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Link 
                      href={shortcut.href} 
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:scale-105 hover:shadow-sm border border-transparent hover:border-current/10 ${shortcut.bg} ${shortcut.color}`}
                    >
                      <shortcut.icon size={16} /> {shortcut.name}
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <div className="relative shrink-0 flex items-center gap-2">
          {!examGoal && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsGoalModalOpen(true)}
              className="px-3 py-2.5 rounded-xl transition-colors bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold text-sm flex items-center gap-2"
            >
              <Flag size={16} /> <span className="hidden sm:inline">Set Goal</span>
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2.5 rounded-xl transition-colors ${
              isSettingsOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            <Settings size={20} />
          </motion.button>

          <AnimatePresence>
            {isSettingsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dashboard Layout</h3>
                    <label className="flex items-center justify-between cursor-pointer mb-3 group">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors"><LayoutDashboard size={16} /> Progress Ring</span>
                      <input type="checkbox" checked={showProgress} onChange={(e) => setShowProgress(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"/>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors"><Activity size={16} /> Activity Log</span>
                      <input type="checkbox" checked={showActivity} onChange={(e) => setShowActivity(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"/>
                    </label>
                  </div>
                  <div className="p-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2 pt-2">Pin Shortcuts</h3>
                    {AVAILABLE_SHORTCUTS.map(shortcut => (
                      <button key={shortcut.id} onClick={() => toggleShortcut(shortcut.id)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-colors">
                        <span className="flex items-center gap-2"><shortcut.icon size={16} /> {shortcut.name}</span>
                        <input type="checkbox" checked={pinnedShortcuts.includes(shortcut.id)} readOnly className="w-4 h-4 accent-indigo-500 rounded pointer-events-none" />
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
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={isRightColumnVisible ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <DailyChecklist tasks={todaysTasks} existingSubjects={uniqueSubjects} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask} />
        </motion.div>

        <AnimatePresence>
          {isRightColumnVisible && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: 'auto' }} exit={{ opacity: 0, x: 20, width: 0, overflow: 'hidden' }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="lg:col-span-1 lg:sticky lg:top-8 flex flex-col gap-6"
            >
              {showProgress && <ProgressRing percentage={progressPercentage} />}
              {showActivity && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}>
                  <ContributionCalendar data={activityData} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGoalModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <button onClick={() => setIsGoalModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
              
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center mb-5">
                <Target size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Set Your Target Exam</h2>
              <p className="text-sm text-slate-500 mb-6">Select a preset or enter a custom goal to start your countdown.</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {EXAM_PRESETS.map(preset => (
                  <button 
                    key={preset.id} onClick={() => applyPreset(preset)} type="button"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <form onSubmit={saveGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam Name</label>
                  <input 
                    type="text" required placeholder="e.g. UPSC Prelims" value={goalName} onChange={(e) => setGoalName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Date</label>
                  <input 
                    type="date" required value={goalDate} min={todayStr} onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium cursor-pointer"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  {examGoal && (
                    <button 
                      type="button" onClick={() => { setExamGoal(null); setIsGoalModalOpen(false); }}
                      className="px-4 py-3 rounded-xl font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
                    {examGoal ? 'Update Goal' : 'Lock In Target'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}