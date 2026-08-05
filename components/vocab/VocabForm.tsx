"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface VocabFormProps {
  onAddWord: (term: string, meaning: string, example: string) => void;
}

export default function VocabForm({ onAddWord }: VocabFormProps) {
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term || !meaning) return;
    
    onAddWord(term, meaning, example);
    
    // Reset form
    setTerm('');
    setMeaning('');
    setExample('');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <input 
        type="text" 
        placeholder="Word or Idiom" 
        value={term} 
        onChange={e => setTerm(e.target.value)}
        className="col-span-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white border border-transparent focus:border-indigo-500 transition-all"
        required
      />
      <input 
        type="text" 
        placeholder="Meaning" 
        value={meaning} 
        onChange={e => setMeaning(e.target.value)}
        className="col-span-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white border border-transparent focus:border-indigo-500 transition-all"
        required
      />
      <textarea 
        placeholder="Example Sentence (Optional)" 
        value={example} 
        onChange={e => setExample(e.target.value)}
        className="col-span-1 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none border border-transparent focus:border-indigo-500 transition-all"
        rows={2}
      />
      <button 
        type="submit" 
        className="col-span-1 md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <Plus size={20} /> Add to Arsenal
      </button>
    </form>
  );
}