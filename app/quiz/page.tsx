"use client";

import { format } from 'date-fns';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Upload, Sparkles, CheckCircle2, XCircle, RefreshCw, FileText, PieChart, Target, ArrowRight } from 'lucide-react';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  
  // Active Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !file) return;

    setIsGenerating(true);
    setQuiz(null);

    try {
      const formData = new FormData();
      if (topic.trim()) formData.append('topic', topic);
      if (file) formData.append('file', file);
      formData.append('count', questionCount.toString()); 

      const res = await fetch('/api/quiz', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Generation failed');
      
      const data = await res.json();
      setQuiz(data);
      
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setIsFinished(false);
      setUserAnswers([]); 
    } catch (err) {
      alert("Failed to generate quiz. Please wait atleast 2 Mintues before trying again or Ensure your PDF is under 20MB and your API key is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; 
    setSelectedAnswer(option);
    
    if (option === quiz![currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    const updatedAnswers = [...userAnswers, selectedAnswer!];
    
    if (currentIndex < quiz!.length - 1) {
      setUserAnswers(updatedAnswers);
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
      
      const storedHistory = JSON.parse(localStorage.getItem('quiz-history') || '[]');
      const newStat = {
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        topic: topic.trim() || (file ? file.name : 'General Knowledge'),
        score: score,
        total: quiz!.length,
        details: quiz!.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: updatedAnswers[i],
          explanation: q.explanation
        }))
      };
      localStorage.setItem('quiz-history', JSON.stringify([...storedHistory, newStat]));
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full min-h-screen space-y-6 sm:space-y-8 bg-slate-50 dark:bg-slate-950">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BrainCircuit className="text-indigo-500 shrink-0" size={32} />
            AI Quiz Generator
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Turn any topic or PDF into an interactive practice test.</p>
        </div>
        
        <Link 
          href="/analysis"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 shrink-0 w-fit"
        >
          <PieChart size={18} />
          View Analysis
        </Link>
      </header>

      {/* COMPACT SIDE-BY-SIDE GENERATOR FORM */}
      {!quiz && !isGenerating && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <form onSubmit={handleGenerate} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
              
              {/* Left Column: Length & Topic */}
              <div className="md:col-span-2 flex flex-col gap-6 justify-between">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Target Length</label>
                  <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {[5, 10, 20].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          questionCount === num 
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Topic Focus</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Modern Indian History, DBMS..." 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Middle Divider (Desktop) */}
              <div className="hidden md:flex flex-col items-center justify-center shrink-0">
                <div className="w-px h-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest my-3">OR</span>
                <div className="w-px h-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              </div>

              {/* Middle Divider (Mobile) */}
              <div className="flex md:hidden items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              </div>

              {/* Right Column: PDF Upload */}
              <div className="md:col-span-2 flex flex-col h-full">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Source Material</label>
                <label className="flex flex-col items-center justify-center w-full flex-1 min-h-[140px] p-6 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 text-slate-600 dark:text-slate-300 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all shadow-sm group">
                  {file ? (
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-5 py-3 rounded-xl max-w-full truncate">
                      <FileText size={20} className="shrink-0" /> 
                      <span className="truncate">{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Upload PDF Document</span>
                      <span className="text-xs font-medium text-slate-400 mt-1 text-center">Extract questions from notes</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden" 
                  />
                </label>
              </div>
              
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={!topic.trim() && !file}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-base mt-2"
            >
              <Sparkles size={20} /> Generate Assessment
            </motion.button>
          </form>
        </motion.section>
      )}

      {/* LOADING STATE */}
      {isGenerating && (
        <div className="max-w-2xl mx-auto py-32 text-center flex flex-col items-center">
          <RefreshCw size={48} className="text-indigo-500 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Analyzing your material...</h2>
          <p className="text-slate-500 font-medium">Gemini is crafting a custom {questionCount}-question assessment.</p>
        </div>
      )}

      {/* COMPACT ACTIVE QUIZ UI */}
      {quiz && !isFinished && !isGenerating && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Target className="text-slate-400" size={18} />
              <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                Question {currentIndex + 1} / {quiz.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="text-indigo-500" size={16} />
              <span className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                Score: {score}
              </span>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-6 leading-snug">
            {quiz[currentIndex].question}
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            {quiz[currentIndex].options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === quiz[currentIndex].correctAnswer;
              
              let style = "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20";
              
              if (selectedAnswer) {
                if (isCorrect) style = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-50 dark:ring-emerald-900/20";
                else if (isSelected) style = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300";
                else style = "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all font-semibold text-slate-700 dark:text-slate-200 text-sm sm:text-base ${style}`}
                >
                  <div className="flex justify-between items-center gap-4">
                    <span>{option}</span>
                    {selectedAnswer && isCorrect && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
                    {selectedAnswer && isSelected && !isCorrect && <XCircle size={20} className="text-rose-500 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedAnswer && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Explanation</h4>
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                      {quiz[currentIndex].explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedAnswer && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={nextQuestion}
              className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-md text-base flex items-center justify-center gap-2 group"
            >
              {currentIndex < quiz.length - 1 ? 'Next Question' : 'Finish Assessment'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </motion.section>
      )}

      {/* ENHANCED RESULTS SCREEN */}
      {isFinished && quiz && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center"
        >
          <div className="mb-6 relative w-32 h-32 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0">
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle 
                cx="64" cy="64" r="60" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="377" 
                strokeDashoffset={377 - (377 * (score / quiz.length))} 
                className={`${getScoreColor((score / quiz.length) * 100)} transition-all duration-1000 ease-out`} 
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center">
              <span className={`text-3xl font-bold ${getScoreColor((score / quiz.length) * 100)}`}>
                {Math.round((score / quiz.length) * 100)}%
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">Assessment Complete</h2>
          <p className="text-slate-500 font-medium mb-10 text-lg">You correctly answered {score} out of {quiz.length} questions.</p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => {
                setQuiz(null);
                setIsFinished(false);
                setScore(0);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setFile(null); 
                setUserAnswers([]);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw size={18} /> New Quiz
            </button>
            <Link
              href="/analysis"
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <PieChart size={18} /> Deep Analysis
            </Link>
          </div>
        </motion.section>
      )}
    </main>
  );
}