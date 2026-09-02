"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task } from '@/app/HomeClient'; // Adjusted import to match standard Next.js pathing
import { CheckCircle2, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Pulling in the DailyStat type used in the focus page
type DailyStat = {
  date: string;
  secondsStudied: number;
};

export default function HistoryPage() {
  const [tasks] = useLocalStorage<Task[]>('hub-tasks', []);
  const [stats] = useLocalStorage<DailyStat[]>('study-stats', []);
  
  // Toggle for showing/hiding focus time
  const [showFocusTime, setShowFocusTime] = useLocalStorage('history-show-focus', true);

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

  // Helper to get total seconds studied on a specific string date ('YYYY-MM-DD')
  const getStudyTimeForDate = (dateStr: string) => {
    const stat = stats.find(s => s.date.startsWith(dateStr));
    return stat ? stat.secondsStudied : 0;
  };

  // Helper to format seconds into "Xh Ym"
  const formatStudyTime = (totalSeconds: number) => {
    if (!totalSeconds) return '0m';
    const totalMins = Math.round(totalSeconds / 60);
    if (totalMins === 0) return '0m';
    if (totalMins < 60) return `${totalMins}m`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen">
      
      <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Completed History</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Review your past missions and accomplishments.</p>
        </div>

        {/* Visibility Toggle */}
        <button 
          onClick={() => setShowFocusTime(!showFocusTime)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm"
        >
          {showFocusTime ? <Eye size={16} className="text-indigo-500" /> : <EyeOff size={16} className="text-slate-400" />}
          {showFocusTime ? 'Hide Focus Time' : 'Show Focus Time'}
        </button>
      </header>

      {sortedDates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <Calendar className="text-slate-300 dark:text-slate-700 w-14 h-14 sm:w-16 sm:h-16 mb-4" />
          <p className="text-slate-500 font-medium">No completed tasks yet. Keep pushing!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const secondsStudied = getStudyTimeForDate(date);
            
            return (
              <motion.div 
                key={date} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-500" size={20} />
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                      {formatHeader(date)}
                    </h2>
                  </div>

                  {/* Render Focus Metric if toggle is ON and they studied that day */}
                  <AnimatePresence>
                    {showFocusTime && secondsStudied > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 px-3 py-1.5 rounded-xl"
                      >
                        <Clock size={16} />
                        {formatStudyTime(secondsStudied)}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}