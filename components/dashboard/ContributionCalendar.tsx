"use client";

import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContributionCalendarProps {
  data: Record<string, number>; // Map of 'YYYY-MM-DD' -> completed task count
}

export default function ContributionCalendar({ data }: ContributionCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number } | null>(null);

  // Generate the last 84 days (12 weeks) ending today
  const days = Array.from({ length: 84 }).map((_, i) => {
    const date = subDays(new Date(), 83 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/50';
    if (count === 1) return 'bg-indigo-200 dark:bg-indigo-900/60';
    if (count === 2 || count === 3) return 'bg-indigo-400 dark:bg-indigo-600';
    return 'bg-indigo-600 dark:bg-indigo-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 mt-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-indigo-500" />
          Activity Log
        </h3>
        
        {/* Dynamic Tooltip */}
        <div className="h-4">
          <AnimatePresence mode="wait">
            {hoveredDate && (
              <motion.span
                key={hoveredDate.date}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {hoveredDate.count} {hoveredDate.count === 1 ? 'mission' : 'missions'} on {format(new Date(hoveredDate.date), 'MMM d')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1.5 sm:gap-2">
        {days.map((dayStr) => {
          const count = data[dayStr] || 0;
          return (
            <motion.div
              key={dayStr}
              whileHover={{ scale: 1.2 }}
              onMouseEnter={() => setHoveredDate({ date: dayStr, count })}
              onMouseLeave={() => setHoveredDate(null)}
              className={`aspect-square rounded-[4px] sm:rounded-md transition-colors cursor-pointer ${getIntensityClass(count)}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-slate-400 font-medium">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50" />
        <div className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-900/60" />
        <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-600" />
        <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-400" />
        <span>More</span>
      </div>
    </div>
  );
}