"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task } from '@/app/HomeClient';
import { CheckCircle2, Calendar } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export default function HistoryPage() {
  const [tasks] = useLocalStorage<Task[]>('hub-tasks', []);

  // Filter only completed tasks that have a date property
  const completedTasks = tasks.filter(t => t.completed && t.date);

  // Group by date
  const groupedTasks = completedTasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => (a < b ? 1 : -1));

  const formatHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'MMMM do, yyyy');
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Completed History</h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Review your past missions and accomplishments.</p>
      </header>

      {sortedDates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <Calendar className="text-slate-300 dark:text-slate-700 w-14 h-14 sm:w-16 sm:h-16 mb-4" />
          <p className="text-slate-500 font-medium">No completed tasks yet. Keep pushing!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <Calendar className="text-indigo-500" size={20} />
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                  {formatHeader(date)}
                </h2>
              </div>
              <ul className="space-y-4">
                {groupedTasks[date].map(task => (
                  <li key={task.id} className="flex items-start gap-3 sm:gap-4 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {task.subject}
                      </span>
                      <span className="text-sm sm:text-base font-medium break-words">{task.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}