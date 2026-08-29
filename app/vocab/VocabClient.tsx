"use client";

import React from 'react';
import VocabForm from '@/components/vocab/VocabForm';
import ReviewSection from '@/components/vocab/ReviewSection';
import VocabList from '@/components/vocab/VocabList';
import { subDays } from 'date-fns';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSpeech } from '@/hooks/useSpeech';

export type VocabEntry = {
  id: string;
  term: string;
  meaning: string;
  example: string;
  dateAdded: string;
};

export default function VocabPage() {
  const { speak } = useSpeech();

  const [words, setWords] = useLocalStorage<VocabEntry[]>('vocab-storage', [
    {
      id: '1',
      term: 'Ubiquitous',
      meaning: 'Present, appearing, or found everywhere.',
      example: 'Smartphones have become ubiquitous in modern society.',
      dateAdded: new Date().toISOString()
    },
    {
      id: '2',
      term: 'Bite the bullet',
      meaning: 'Decide to do something difficult or unpleasant that one has been putting off.',
      example: 'I had to bite the bullet and pay for the expensive car repairs.',
      dateAdded: subDays(new Date(), 7).toISOString()
    },
  ]);

  const handleAddWord = (term: string, meaning: string, example: string) => {
    const newEntry: VocabEntry = {
      id: Date.now().toString(),
      term,
      meaning,
      example,
      dateAdded: new Date().toISOString(),
    };

    setWords((prevWords) => [newEntry, ...prevWords]);
  };

  const handlePlayAudio = (text: string) => {
    speak(text);
  };

  // NEW: Function to delete a word by its ID
  const handleDeleteWord = (id: string) => {
    setWords((prevWords) => prevWords.filter((word) => word.id !== id));
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Vocabulary Arsenal</h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Expand your lexicon and track idioms for your exams.</p>
      </header>

      <ReviewSection words={words} onPlayAudio={handlePlayAudio} />

      <div className="space-y-8 sm:space-y-12">
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Add New Entry</h2>
          <VocabForm onAddWord={handleAddWord} />
        </section>

        <section>
          {/* NEW: Passed onDeleteWord prop to VocabList */}
          <VocabList 
            words={words} 
            onPlayAudio={handlePlayAudio} 
            onDeleteWord={handleDeleteWord} 
          />
        </section>
      </div>
    </main>
  );
}