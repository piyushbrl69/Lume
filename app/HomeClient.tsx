"use client";

import React, { useEffect } from 'react';
import DailyChecklist from '@/components/dashboard/DailyChecklist';
import ProgressRing from '@/components/dashboard/ProgressRing';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('hub-tasks', []);

  // Store recurring templates separately so they persist across days
  const [recurringTemplates, setRecurringTemplates] = useLocalStorage<RecurringTaskTemplate[]>('hub-recurring-templates', []);

  // Refactored Streak Tracking
  const [streakInfo, setStreakInfo] = useLocalStorage('hub-streak', {
    count: 0,
    lastCompletedDate: '', // Tracks the date the streak was last bumped
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // --- Auto-generate today's recurring tasks on load ---
  useEffect(() => {
    if (!recurringTemplates || recurringTemplates.length === 0) return;

    const dayOfWeek = new Date().getDay(); // 0 = Sun, 1-5 = Mon-Fri, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Filter templates active for today
    const activeTemplates = recurringTemplates.filter(template => {
      if (template.frequency === 'daily') return true;
      if (template.frequency === 'weekdays') return !isWeekend;
      if (template.frequency === 'weekends') return isWeekend;
      return false;
    });

    setTasks(prevTasks => {
      const todayTasks = prevTasks.filter(t => t.date === todayStr);
      const existingTaskTexts = new Set(todayTasks.map(t => t.text.toLowerCase()));

      // Only generate tasks that don't already exist for today
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
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    // Dynamic Streak Evaluation
    const updatedTodaysTasks = updatedTasks.filter(t => t.date === todayStr);
    const isAllDone = updatedTodaysTasks.length > 0 && updatedTodaysTasks.every(t => t.completed);

    if (isAllDone && streakInfo.lastCompletedDate !== todayStr) {
      // First time completing all tasks today
      setStreakInfo({ count: streakInfo.count + 1, lastCompletedDate: todayStr });
    } else if (!isAllDone && streakInfo.lastCompletedDate === todayStr) {
      // Unchecked a task on the same day, remove the streak bump
      setStreakInfo({ count: Math.max(0, streakInfo.count - 1), lastCompletedDate: '' });
    }
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

    // If it's a recurring task, save it to templates so it persists for future days
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

    // If it was a recurring task, remove it from templates as well
    if (taskToDelete?.frequency && taskToDelete.frequency !== 'once') {
      setRecurringTemplates(prev =>
        prev.filter(t => t.text.toLowerCase() !== taskToDelete.text.toLowerCase())
      );
    }

    setTasks(tasks.filter(task => task.id !== id));
  };

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Math', 'Science', 'Aptitude', 'Coding', 'English', 'History', 'Geography');

  const completedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">The Hub</h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Your daily command center.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Animated Main Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="lg:col-span-2"
        >
          <DailyChecklist
            tasks={todaysTasks}
            existingSubjects={uniqueSubjects}
            streakCount={streakInfo.count}
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
          />
        </motion.div>

        {/* Animated Sidebar Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="lg:col-span-1 lg:sticky lg:top-8"
        >
          <ProgressRing percentage={progressPercentage} />
        </motion.div>
      </div>
    </main>
  );
}