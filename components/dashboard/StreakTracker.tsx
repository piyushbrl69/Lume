"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakTrackerProps {
  streak: number;
  isAllDone: boolean;
}

export default function StreakTracker({ streak, isAllDone }: StreakTrackerProps) {
  return (
    <motion.div 
      animate={{ scale: isAllDone ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
        isAllDone ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      <Flame className={isAllDone ? "fill-orange-500 text-orange-500" : ""} size={20} />
      <span className="font-semibold">{streak} Day Streak</span>
    </motion.div>
  );
}