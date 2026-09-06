"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task } from '@/app/HomeClient'; // Adjusted import to match standard Next.js pathing
import { CheckCircle2, Calendar, Clock, Eye, EyeOff, BrainCircuit } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type DailyStat = {
  date: string;
  secondsStudied: number;
};

// New Type for Quiz History
type QuizStat = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  topic: string;
  score: number;
  total: number;
};

export default function HistoryPage() {
  const [tasks] = useLocalStorage<Task[]>('hub-tasks', []);
  const [stats] = useLocalStorage<DailyStat[]>('study-stats', []);
  
  // Pull in the quiz history
  const [quizStats] = useLocalStorage<QuizStat[]>('quiz-history', []);
  
  const [showFocusTime, setShowFocusTime] = useLocalStorage('history-show-focus', true);

  // Filter and Group Tasks
  const completedTasks = tasks.filter(t => t.completed && t.date);
  const groupedTasks = completedTasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group Quizzes by Date
  const groupedQuizzes = quizStats.reduce((acc, quiz) => {
    if (!acc[quiz.date]) acc[quiz.date] = [];
    acc[quiz.date].push(quiz);
    return acc;
  }, {} as Record<string, QuizStat[]>);

  // Merge all dates from both Tasks and Quizzes, then sort descending
  const allDatesSet = new Set([...Object.keys(groupedTasks), ...Object.keys(groupedQuizzes)]);
  const sortedDates = Array.from(allDatesSet).sort((a, b) => (a < b ? 1 : -1));

  const formatHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'MMMM do, yyyy');
  };

  const getStudyTimeForDate = (dateStr: string) => {
    const stat = stats.find(s => s.date.startsWith(dateStr));
    return stat ? stat.secondsStudied : 0;
  };

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
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Review your past missions, quizzes, and accomplishments.</p>
        </div>

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
          <p className="text-slate-500 font-medium">No history yet. Keep pushing!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const secondsStudied = getStudyTimeForDate(date);
            const dayTasks = groupedTasks[date] || [];
            const dayQuizzes = groupedQuizzes[date] || [];
            
            // Group the day's quizzes by topic so it displays "X quizzes solved in [Topic]"
            const quizzesByTopic = dayQuizzes.reduce((acc, q) => {
              const t = q.topic || 'General Knowledge';
              if (!acc[t]) acc[t] = { count: 0, score: 0, total: 0 };
              acc[t].count += 1;
              acc[t].score += q.score;
              acc[t].total += q.total;
              return acc;
            }, {} as Record<string, { count: number; score: number; total: number }>);
            
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
                  {/* 1. Render Quizzes First */}
                  {Object.entries(quizzesByTopic).map(([topicName, data]) => (
                    <li key={`quiz-${topicName}`} className="flex items-start gap-3 sm:gap-4 text-slate-700 dark:text-slate-300">
                      <BrainCircuit size={22} className="text-purple-500 shrink-0 mt-0.5" />
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                          Quiz
                        </span>
                        <span className="text-sm sm:text-base font-medium break-words">
                          {data.count} {data.count === 1 ? 'quiz' : 'quizzes'} solved in <span className="font-bold">{topicName}</span> ({data.score}/{data.total})
                        </span>
                      </div>
                    </li>
                  ))}

                  {/* 2. Render Tasks */}
                  {dayTasks.map(task => (
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