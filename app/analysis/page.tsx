"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Target, CheckCircle2, XCircle, BrainCircuit, ChevronDown, ChevronUp, Clock, AlertCircle, Search, Calendar, Filter } from 'lucide-react';

type QuizDetail = {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
};

type QuizStat = {
  id: string;
  date: string;
  topic: string;
  score: number;
  total: number;
  details?: QuizDetail[];
};

export default function AnalysisPage() {
  const [history, setHistory] = useState<QuizStat[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('quiz-history') || '[]');
    setHistory(stored.sort((a: QuizStat, b: QuizStat) => b.id.localeCompare(a.id)));
  }, []);

  // Extract unique dates for the dropdown filter
  const uniqueDates = Array.from(new Set(history.map(q => q.date))).sort((a, b) => b.localeCompare(a));

  // Apply Filters
  const filteredHistory = history.filter(quiz => {
    const matchesSearch = quiz.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === 'All' || quiz.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  // Calculate Dynamic Metrics based on Filtered Data
  const totalQuizzes = filteredHistory.length;
  const totalQuestions = filteredHistory.reduce((acc, curr) => acc + curr.total, 0);
  const totalCorrect = filteredHistory.reduce((acc, curr) => acc + curr.score, 0);
  const totalIncorrect = totalQuestions - totalCorrect;
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen bg-slate-50 dark:bg-slate-950 space-y-8">
      
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <PieChart className="text-indigo-500 shrink-0" size={32} />
          Performance Analysis
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Track your accuracy and review past mistakes to improve retention.</p>
      </header>

      {/* DYNAMIC FILTER BAR */}
      <section className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        
        {/* Topic Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by topic (e.g., Operating Systems)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 text-sm font-medium transition-all"
          />
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar size={18} className="text-slate-400 hidden sm:block" />
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-sm transition-all"
          >
            <option value="All">All Time</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </section>

      {/* TOP METRICS DASHBOARD (Dynamically updates based on filters) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
          <BrainCircuit className="text-indigo-500 mb-2" size={24} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quizzes Found</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-1">{totalQuizzes}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
          <Target className="text-blue-500 mb-2" size={24} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Accuracy</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-1">{overallAccuracy}%</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex flex-col justify-center items-center text-center">
          <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Questions Correct</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{totalCorrect}</p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-sm flex flex-col justify-center items-center text-center">
          <XCircle className="text-rose-500 mb-2" size={24} />
          <p className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">Questions Missed</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-700 dark:text-rose-400 mt-1">{totalIncorrect}</p>
        </div>
      </section>

      {/* DETAILED HISTORY LOG */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Clock size={20} className="text-slate-400" />
          Filtered Assessment Logs
        </h2>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Filter size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No results found</h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">Adjust your search or date filter to see more data.</p>
          </div>
        ) : (
          filteredHistory.map((quiz) => {
            const accuracy = Math.round((quiz.score / quiz.total) * 100);
            const isExpanded = expandedId === quiz.id;

            return (
              <div key={quiz.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                
                {/* Header Row (Clickable) */}
                <button 
                  onClick={() => toggleExpand(quiz.id)}
                  className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg pr-4">{quiz.topic}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{quiz.date}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 w-full sm:w-auto">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Score</p>
                        <p className={`font-bold ${accuracy >= 80 ? 'text-emerald-500' : accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {quiz.score} / {quiz.total}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Accuracy</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{accuracy}%</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                    >
                      <div className="p-4 sm:p-6 space-y-6">
                        {!quiz.details ? (
                          <p className="text-sm text-slate-500 italic font-medium">Detailed breakdown unavailable for legacy quizzes.</p>
                        ) : (
                          quiz.details.map((q, idx) => {
                            const isCorrect = q.userAnswer === q.correctAnswer;
                            
                            return (
                              <div key={idx} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-start gap-3 mb-4">
                                  {isCorrect ? (
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={22} />
                                  ) : (
                                    <XCircle className="text-rose-500 shrink-0 mt-0.5" size={22} />
                                  )}
                                  <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base leading-snug">
                                    <span className="text-slate-400 mr-2">{idx + 1}.</span>
                                    {q.question}
                                  </h4>
                                </div>
                                
                                <div className="ml-9 space-y-2 text-sm font-semibold">
                                  <p className="text-slate-500 flex flex-wrap gap-2 items-center">
                                    <span className="uppercase text-[10px] tracking-wider font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Your Answer</span> 
                                    <span className={isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                      {q.userAnswer}
                                    </span>
                                  </p>
                                  
                                  {!isCorrect && (
                                    <p className="text-slate-500 flex flex-wrap gap-2 items-center">
                                      <span className="uppercase text-[10px] tracking-wider font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-emerald-600 dark:text-emerald-400">Correct Answer</span> 
                                      <span className="text-emerald-600 dark:text-emerald-400">{q.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>
                                
                                <div className="ml-9 mt-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl">
                                  <p className="text-xs sm:text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                                    <span className="font-bold mr-1">Explanation:</span> 
                                    {q.explanation}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}