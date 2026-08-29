"use client";

import React, { useEffect, useMemo, useState } from 'react';
import DailyChecklist from '@/components/dashboard/DailyChecklist';
import ProgressRing from '@/components/dashboard/ProgressRing';
import ContributionCalendar from '@/components/dashboard/ContributionCalendar';
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
  const [recurringTemplates, setRecurringTemplates] = useLocalStorage<RecurringTaskTemplate[]>('hub-recurring-templates', []);
  
  // Greeting State
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

    const dayOfWeek = new Date().getDay(); // 0 = Sun, 1-5 = Mon-Fri, 6 = Sat
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

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Math', 'Science', 'Aptitude', 'Coding', 'English', 'History', 'Geography');

  const completedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Generate map of dates to completed task counts for the calendar
  const activityData = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (task.completed) {
        acc[task.date] = (acc[task.date] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto min-h-screen">
      <header className="mb-6 sm:mb-8 min-h-[4rem]">
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
          className="lg:col-span-1 lg:sticky lg:top-8 flex flex-col"
        >
          <ProgressRing percentage={progressPercentage} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <ContributionCalendar data={activityData} />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}