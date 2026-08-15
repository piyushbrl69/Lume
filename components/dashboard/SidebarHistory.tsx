"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task } from '@/app/page';
import { CheckCircle2, History } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export default function SidebarHistory() {
  const [tasks] = useLocalStorage<Task[]>('hub-tasks', []);

  // Filter only completed tasks that have a date
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
    return format(date, 'MMM do, yyyy');
  };

  return (
    <div className="mt-8 px-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        <History size={14} />
        <span>Completed History</span>
      </div>
      
      {sortedDates.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No completed tasks yet.</p>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedDates.map(date => (
            <div key={date} className="space-y-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                {formatHeader(date)}
              </span>
              <ul className="space-y-1.5 pl-1">
                {groupedTasks[date].map(task => (
                  <li key={task.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">{task.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}