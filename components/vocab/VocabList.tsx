"use client";

import React from 'react';
import { Volume2, Calendar, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VocabEntry } from '@/app/vocab/page';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface VocabListProps {
  words: VocabEntry[];
  onPlayAudio: (text: string) => void;
  onDeleteWord: (id: string) => void;
}

const itemVariants : Variants= {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function VocabList({ words, onPlayAudio, onDeleteWord }: VocabListProps) {
  const groupedWords = words.reduce((groups, word) => {
    const dateKey = format(parseISO(word.dateAdded), 'MMM dd, yyyy');

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(word);
    return groups;
  }, {} as Record<string, VocabEntry[]>);

  if (words.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="text-center py-12 px-4 text-slate-500 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"
      >
        No words added yet. Start building your arsenal above!
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedWords).map(([date, dateWords]) => (
          <motion.div 
            key={date} 
            layout 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Calendar size={20} className="text-indigo-500 shrink-0" />
              {date === format(new Date(), 'MMM dd, yyyy') ? 'Today' : date}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {dateWords.map(word => (
                  <motion.div 
                    layout // MAGIC LAYOUT: smoothly animates siblings when one gets deleted
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    key={word.id} 
                    className="group bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-3 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1 break-words">{word.term}</h4>
                      <p className="text-slate-600 dark:text-slate-300 font-medium mb-2 break-words">{word.meaning}</p>
                      {word.example && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic break-words">&quot;{word.example}&quot;</p>
                      )}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-start shrink-0">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onPlayAudio(word.term)} 
                        className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Listen to pronunciation"
                      >
                        <Volume2 size={22} />
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDeleteWord(word.id)} 
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        title="Delete word"
                      >
                        <Trash2 size={22} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}