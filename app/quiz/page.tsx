"use client";
import { format } from 'date-fns';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Upload, Sparkles, CheckCircle2, XCircle, RefreshCw, FileText } from 'lucide-react';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5); // New State for Question Count
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  
  // Active Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !file) return;

    setIsGenerating(true);
    setQuiz(null);

    try {
      const formData = new FormData();
      if (topic.trim()) formData.append('topic', topic);
      if (file) formData.append('file', file);
      formData.append('count', questionCount.toString()); // Pass the count to the backend

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
    } catch (err) {
      alert("Failed to generate quiz. Ensure your PDF is under 20MB and your API key is valid.");
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
    if (currentIndex < quiz!.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
      
      // Save the final result to localStorage so HistoryPage can read it
      const storedHistory = JSON.parse(localStorage.getItem('quiz-history') || '[]');
      const newStat = {
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        topic: topic.trim() || (file ? file.name : 'General Knowledge'),
        score: score,
        total: quiz!.length
      };
      localStorage.setItem('quiz-history', JSON.stringify([...storedHistory, newStat]));
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 bg-slate-50 dark:bg-slate-950">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <BrainCircuit className="text-indigo-500 shrink-0" size={32} />
          AI Quiz Generator
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Turn any topic or PDF into an interactive practice test.</p>
      </header>

      {/* GENERATOR FORM */}
      {!quiz && !isGenerating && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <form onSubmit={handleGenerate} className="space-y-6">
            
            {/* Length Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quiz Length</label>
              <div className="flex gap-2">
                {[5, 10, 20].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      questionCount === num 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What are you studying?</label>
              <input 
                type="text" 
                placeholder="e.g. Operating Systems, Modern Indian History..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AND / OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload Source Material (PDF)</label>
              <label className="flex flex-col items-center justify-center w-full p-6 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
                {file ? (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                    <FileText size={24} /> {file.name}
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-400 mb-2" />
                    <span className="text-sm font-medium">Click to attach a PDF document</span>
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

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!topic.trim() && !file}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={20} /> Generate Intelligence
            </motion.button>
          </form>
        </motion.section>
      )}

      {/* LOADING STATE */}
      {isGenerating && (
        <div className="max-w-2xl py-20 text-center flex flex-col items-center">
          <RefreshCw size={48} className="text-indigo-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analyzing your material...</h2>
          <p className="text-slate-500">Gemini is crafting your custom {questionCount}-question quiz.</p>
        </div>
      )}

      {/* ACTIVE QUIZ UI */}
      {quiz && !isFinished && !isGenerating && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question {currentIndex + 1} of {quiz.length}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
              Score: {score}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-8 leading-snug">
            {quiz[currentIndex].question}
          </h2>

          <div className="space-y-3 mb-8">
            {quiz[currentIndex].options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === quiz[currentIndex].correctAnswer;
              
              let style = "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20";
              
              if (selectedAnswer) {
                if (isCorrect) style = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300";
                else if (isSelected) style = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300";
                else style = "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-slate-700 dark:text-slate-200 ${style}`}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {selectedAnswer && isCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                    {selectedAnswer && isSelected && !isCorrect && <XCircle size={20} className="text-rose-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedAnswer && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 mb-6"
              >
                <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
                  {quiz[currentIndex].explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedAnswer && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={nextQuestion}
              className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-colors"
            >
              {currentIndex < quiz.length - 1 ? 'Next Question' : 'View Results'}
            </motion.button>
          )}
        </motion.section>
      )}

      {/* RESULTS SCREEN */}
      {isFinished && quiz && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center"
        >
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 mb-8">You scored {score} out of {quiz.length}.</p>

          <button
            onClick={() => {
              setQuiz(null);
              setIsFinished(false);
              setScore(0);
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setFile(null); 
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={20} /> Generate Another
          </button>
        </motion.section>
      )}
    </main>
  );
}