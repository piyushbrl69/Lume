"use client";

import React from 'react';
import { Volume2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VocabEntry } from '@/app/vocab/page';

interface VocabListProps {
  words: VocabEntry[];
  onPlayAudio: (text: string) => void;
}

export default function VocabList({ words, onPlayAudio }: VocabListProps) {
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
      <div className="text-center py-12 text-slate-500 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
        No words added yet. Start building your arsenal above!
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedWords).map(([date, dateWords]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Calendar size={20} className="text-indigo-500" /> 
            {date === format(new Date(), 'MMM dd, yyyy') ? 'Today' : date}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {dateWords.map(word => (
              <div key={word.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-start hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-colors">
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{word.term}</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">{word.meaning}</p>
                  {word.example && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">&quot;{word.example}&quot;</p>
                  )}
                </div>
                <button onClick={() => onPlayAudio(word.term)} className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 ml-4">
                  <Volume2 size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}