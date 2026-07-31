"use client";

import React, { useEffect, useState } from 'react';
import DailyChecklist from '@/components/dashboard/DailyChecklist';
import ProgressRing from '@/components/dashboard/ProgressRing';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format } from 'date-fns';

export type Task = {
  id: string;
  text: string;
  subject: string;
  completed: boolean;
  date: string; // To track daily resets
};

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('hub-tasks', []);
  
  // Refactored Streak Tracking
  const [streakInfo, setStreakInfo] = useLocalStorage('hub-streak', {
    count: 0,
    lastCompletedDate: '', // Tracks the date the streak was last bumped
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
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

  const addTask = (text: string, subject: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      subject,
      completed: false,
      date: todayStr, // Lock task to today
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Math', 'Science');

  const completedTasks = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">The Hub</h1>
        <p className="text-slate-500 mt-2">Your daily command center.</p>
      </header>

      {/* Cleaned up 2-column Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <DailyChecklist 
            tasks={todaysTasks} // Only pass today's tasks
            existingSubjects={uniqueSubjects}
            streakCount={streakInfo.count}
            onToggleTask={toggleTask} 
            onAddTask={addTask} 
            onDeleteTask={deleteTask} 
          />
        </div>

        <div className="lg:col-span-1 sticky top-8">
          <ProgressRing percentage={progressPercentage} />
        </div>
      </div>
    </main>
  );
}