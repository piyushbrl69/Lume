"use client";

import React, { useState, useEffect } from 'react';
import Flashcard, { FlashcardData } from '@/components/flashcards/Flashcard';
import { Plus, BookOpen, Settings, Filter, CheckCircle2 } from 'lucide-react';
import { format, isSameDay, addDays, parseISO, isBefore } from 'date-fns';

interface VocabSyncEntry {
  id: string;
  term: string;
  meaning: string;
  dateAdded: string;
}

export default function FlashcardsPage() {
  const [deck, setDeck] = useState<FlashcardData[]>([]);
  const [studyQueue, setStudyQueue] = useState<FlashcardData[]>([]);
  const [mode, setMode] = useState<'study' | 'manage'>('study');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Progress Tracking
  const [initialQueueSize, setInitialQueueSize] = useState(0);

  // Form State
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  // 1. GENERATE STUDY QUEUE (Declared first so useEffect can use it)
  const generateStudyQueue = (currentDeck: FlashcardData[], filter: string) => {
    const today = new Date();
    let dueCards = currentDeck.filter(card =>
      isBefore(parseISO(card.nextReviewDate), today) || isSameDay(parseISO(card.nextReviewDate), today)
    );

    // Apply Date Filter
    if (filter === 'today') {
      dueCards = dueCards.filter(card => isSameDay(parseISO(card.dateAdded), today));
    } else if (filter === 'past-7') {
      const sevenDaysAgo = addDays(today, -7);
      dueCards = dueCards.filter(card => isBefore(sevenDaysAgo, parseISO(card.dateAdded)));
    }

    setStudyQueue(dueCards);
    setInitialQueueSize(dueCards.length);
  };

  // 2. INITIALIZE DATA & SYNC VOCAB
  useEffect(() => {
    // Load existing deck
    const savedDeck = localStorage.getItem('flashcard-deck');
    const currentDeck: FlashcardData[] = savedDeck ? JSON.parse(savedDeck) : [];

    // Auto-sync Vocabulary from localStorage
    const savedVocab = localStorage.getItem('vocab-storage');
    if (savedVocab) {
      const vocabList: VocabSyncEntry[] = JSON.parse(savedVocab);
      vocabList.forEach((v) => {
        // Only add if it doesn't already exist in the deck
        if (!currentDeck.find(card => card.front === v.term)) {
          currentDeck.push({
            id: `vocab-${v.id}`,
            front: v.term,
            back: v.meaning,
            source: 'vocab',
            dateAdded: v.dateAdded,
            nextReviewDate: new Date().toISOString(), // Due immediately
            lastRating: null
          });
        }
      });
    }

    const frame = requestAnimationFrame(() => {
      setDeck(currentDeck);
      generateStudyQueue(currentDeck, 'all');
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // Handle Filter Change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filter = e.target.value;
    setDateFilter(filter);
    generateStudyQueue(deck, filter);
  };

  // 3. ADD NEW CUSTOM CARD
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront || !newBack) return;

    const newCard: FlashcardData = {
      id: Date.now().toString(),
      front: newFront,
      back: newBack,
      source: 'custom',
      dateAdded: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(),
      lastRating: null
    };

    const updatedDeck = [...deck, newCard];
    setDeck(updatedDeck);
    localStorage.setItem('flashcard-deck', JSON.stringify(updatedDeck));

    // Refresh queue to include new card if applicable
    generateStudyQueue(updatedDeck, dateFilter);

    setNewFront('');
    setNewBack('');
  };

  // 4. SPACED REPETITION ALGORITHM
  const handleRateCard = (id: string, rating: 'easy' | 'medium' | 'hard') => {
    const today = new Date();
    let daysToAdd = 1; // Default for Hard

    if (rating === 'medium') daysToAdd = 3;
    if (rating === 'easy') daysToAdd = 7;

    const nextDate = addDays(today, daysToAdd).toISOString();

    // Update the main deck
    const updatedDeck = deck.map(card => {
      if (card.id === id) {
        return { ...card, lastRating: rating, nextReviewDate: nextDate };
      }
      return card;
    });

    setDeck(updatedDeck);
    localStorage.setItem('flashcard-deck', JSON.stringify(updatedDeck));

    // Remove from current active study queue
    setStudyQueue((prev) => prev.filter(card => card.id !== id));
  };

  const progressPercentage = initialQueueSize === 0 ? 100 : ((initialQueueSize - studyQueue.length) / initialQueueSize) * 100;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950">

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Active Recall</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Master your topics through spaced repetition.</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setMode('study')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${mode === 'study' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <BookOpen size={18} /> Study
          </button>
          <button
            onClick={() => setMode('manage')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${mode === 'manage' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Settings size={18} /> Manage
          </button>
        </div>
      </header>

      {/* STUDY MODE */}
      {mode === 'study' && (
        <section className="flex flex-col items-center justify-center py-4">

          {/* Controls & Progress */}
          <div className="w-full max-w-lg mb-8 space-y-6">
            <div className="flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Filter size={18} />
                <span className="font-semibold text-sm">Filter Due Cards:</span>
              </div>
              <select
                value={dateFilter}
                onChange={handleFilterChange}
                className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-lg outline-none font-medium text-sm cursor-pointer border border-transparent focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Added Today</option>
                <option value="past-7">Past 7 Days</option>
              </select>
            </div>

            {/* Extra Feature: Progress Bar */}
            {initialQueueSize > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Session Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{studyQueue.length} cards left</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {studyQueue.length > 0 ? (
            <div className="w-full space-y-8">
              <Flashcard
                key={studyQueue[0].id}
                card={studyQueue[0]}
                onRate={handleRateCard}
              />
            </div>
          ) : (
            <div className="text-center bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-lg w-full mt-8">
              <div className="flex justify-center mb-4 text-emerald-500"><CheckCircle2 size={48} /></div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">You&apos;re all caught up!</h2>
              <p className="text-slate-500 mb-8 text-sm sm:text-base">No cards due right now based on your selected filter. Take a break!</p>
              <button
                onClick={() => generateStudyQueue(deck, dateFilter)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Refresh Queue
              </button>
            </div>
          )}
        </section>
      )}

      {/* MANAGE DECK MODE */}
      {mode === 'manage' && (
        <section className="space-y-8">
          {/* Create Form */}
          <form onSubmit={handleAddCard} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              placeholder="Front (Question/Concept)"
              value={newFront}
              onChange={e => setNewFront(e.target.value)}
              className="col-span-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none border border-transparent"
              rows={3}
              required
            />
            <textarea
              placeholder="Back (Answer/Definition)"
              value={newBack}
              onChange={e => setNewBack(e.target.value)}
              className="col-span-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none border border-transparent"
              rows={3}
              required
            />
            <button type="submit" className="col-span-1 md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Plus size={20} /> Create Custom Flashcard
            </button>
          </form>

          {/* List of Cards */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Total Database ({deck.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deck.map((card) => (
                <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3 relative">

                  <div className="absolute top-4 right-4 flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md font-bold ${card.source === 'vocab' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30'}`}>
                      {card.source}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Front</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium pr-16 break-words">{card.front}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Back</span>
                    <p className="text-slate-600 dark:text-slate-400 break-words">{card.back}</p>
                  </div>
                  <div className="mt-auto pt-2 text-xs text-slate-400 font-medium flex flex-wrap gap-x-4 gap-y-1">
                    <span>Added: {format(parseISO(card.dateAdded), 'MMM dd')}</span>
                    <span>Due: {isSameDay(parseISO(card.nextReviewDate), new Date()) ? 'Today' : format(parseISO(card.nextReviewDate), 'MMM dd')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}