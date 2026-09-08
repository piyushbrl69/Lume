"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, Sparkles, RefreshCw, Plus, Trash2, 
  CheckCircle2, Clock, Circle, ArrowLeft,
  Calculator, Book, Brain, Atom, Landmark, Globe, Cpu, Activity, FileText
} from 'lucide-react';

export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export type TopicItem = {
  id: string;
  name: string;
  status: TopicStatus;
};

export type SubjectItem = {
  id: string;
  name: string;
  topics: TopicItem[];
};

export type ExamSyllabus = {
  examName: string;
  subjects: SubjectItem[];
};

// Smart Theme Generator based on subject keywords
const getSubjectTheme = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('math') || lower.includes('numerical') || lower.includes('algebra') || lower.includes('probability')) {
    return { icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', fill: 'bg-blue-500' };
  }
  if (lower.includes('english') || lower.includes('verbal') || lower.includes('grammar') || lower.includes('reading')) {
    return { icon: Book, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/30', fill: 'bg-rose-500' };
  }
  if (lower.includes('reasoning') || lower.includes('logic') || lower.includes('aptitude')) {
    return { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', fill: 'bg-purple-500' };
  }
  if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology')) {
    return { icon: Atom, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', fill: 'bg-emerald-500' };
  }
  if (lower.includes('history') || lower.includes('polity') || lower.includes('civics')) {
    return { icon: Landmark, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', fill: 'bg-amber-500' };
  }
  if (lower.includes('geography') || lower.includes('earth') || lower.includes('environment')) {
    return { icon: Globe, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/30', fill: 'bg-teal-500' };
  }
  if (lower.includes('computer') || lower.includes('it') || lower.includes('software') || lower.includes('hardware')) {
    return { icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/30', fill: 'bg-cyan-500' };
  }
  if (lower.includes('current') || lower.includes('affairs') || lower.includes('general awareness') || lower.includes('gk')) {
    return { icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30', fill: 'bg-orange-500' };
  }
  return { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', fill: 'bg-indigo-500' };
};

export default function RoadmapPage() {
  const [syllabus, setSyllabus] = useLocalStorage<ExamSyllabus | null>('lume-exam-syllabus', null);
  const [examInput, setExamInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  const generateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examInput.trim()) return;

    setLoading(true);
    setActiveSubjectId(null);
    try {
      const res = await fetch('/api/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName: examInput.trim() })
      });

      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();

      const formatted: ExamSyllabus = {
        examName: data.examName,
        subjects: data.subjects.map((sub: any, sIdx: number) => ({
          id: `sub-${Date.now()}-${sIdx}`,
          name: sub.name,
          topics: sub.topics.map((topName: string, tIdx: number) => ({
            id: `top-${Date.now()}-${sIdx}-${tIdx}`,
            name: topName,
            status: 'not_started' as TopicStatus
          }))
        }))
      };

      setSyllabus(formatted);
    } catch (err) {
      alert('Could not generate syllabus. Please wait atleast 2 Mintues before trying again or Check your connection or API key.');
    } finally {
      setLoading(false);
    }
  };

  const cycleStatus = (subjectId: string, topicId: string) => {
    if (!syllabus) return;

    setSyllabus({
      ...syllabus,
      subjects: syllabus.subjects.map(sub => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          topics: sub.topics.map(topic => {
            if (topic.id !== topicId) return topic;
            const nextStatus: Record<TopicStatus, TopicStatus> = {
              not_started: 'in_progress',
              in_progress: 'completed',
              completed: 'not_started'
            };
            return { ...topic, status: nextStatus[topic.status] };
          })
        };
      })
    });
  };

  const addTopic = (subjectId: string) => {
    const topicName = prompt('Enter new topic name:');
    if (!topicName || !syllabus) return;

    setSyllabus({
      ...syllabus,
      subjects: syllabus.subjects.map(sub => {
        if (sub.id !== subjectId) return sub;
        return {
          ...sub,
          topics: [
            ...sub.topics,
            { id: `top-${Date.now()}`, name: topicName.trim(), status: 'not_started' }
          ]
        };
      })
    });
  };

  const deleteTopic = (subjectId: string, topicId: string) => {
    if (!syllabus) return;
    setSyllabus({
      ...syllabus,
      subjects: syllabus.subjects.map(sub => {
        if (sub.id !== subjectId) return sub;
        return { ...sub, topics: sub.topics.filter(t => t.id !== topicId) };
      })
    });
  };

  const deleteSubject = (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!syllabus || !confirm('Delete this entire subject?')) return;
    
    if (activeSubjectId === subjectId) {
      setActiveSubjectId(null);
    }

    setSyllabus({
      ...syllabus,
      subjects: syllabus.subjects.filter(s => s.id !== subjectId)
    });
  };

  const totalTopics = syllabus?.subjects.reduce((acc, s) => acc + s.topics.length, 0) || 0;
  const completedTopics = syllabus?.subjects.reduce(
    (acc, s) => acc + s.topics.filter(t => t.status === 'completed').length, 0
  ) || 0;
  const overallPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const activeSubject = syllabus?.subjects.find(s => s.id === activeSubjectId);
  const activeSubjectTheme = activeSubject ? getSubjectTheme(activeSubject.name) : null;

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full min-h-screen space-y-6 sm:space-y-8 bg-slate-50 dark:bg-slate-950">
      
      {/* GLOBAL HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <GitFork className="text-indigo-500 shrink-0" size={28} />
            Topic Progress Tree
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Track depth and readiness across all examination subjects.
          </p>
        </div>

        {syllabus && (
          <button
            onClick={() => {
              if (confirm('Start a new exam syllabus? Current progress will reset.')) {
                setSyllabus(null);
                setActiveSubjectId(null);
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-sm transition-colors self-start shrink-0"
          >
            <RefreshCw size={14} /> Switch Exam
          </button>
        )}
      </header>

      {/* SETUP FORM */}
      {!syllabus && !loading && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">What exam are you tackling?</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your target exam. AI will structure all official subjects and sub-topics into an actionable tracking tree.
          </p>

          <form onSubmit={generateSyllabus} className="space-y-4">
            <input 
              type="text"
              required
              placeholder="e.g. GATE CS/IT, AFCAT, CDS, SSC CGL..."
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
            />

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Sparkles size={18} /> Generate Topic Tree
            </button>
          </form>
        </motion.section>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="max-w-xl mx-auto py-32 text-center flex flex-col items-center">
          <RefreshCw size={40} className="text-indigo-500 animate-spin mb-6" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Mapping Curriculum...</h3>
          <p className="text-slate-500 font-medium text-sm">Analyzing granular syllabus structure for {examInput}.</p>
        </div>
      )}

      {/* ACTIVE SYLLABUS VIEWS */}
      {syllabus && !loading && (
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: SUBJECT GRID OVERVIEW */}
          {!activeSubjectId ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Overall Progress Banner */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded uppercase tracking-widest">
                    Active Roadmap
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-2 mb-0.5">{syllabus.examName}</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    {completedTopics} out of {totalTopics} total topics mastered
                  </p>
                </div>

                <div className="sm:w-2/5 shrink-0">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500">Overall Readiness</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{overallPercentage}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${overallPercentage}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Blocks Grid (Compact & Colorful) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {syllabus.subjects.map(subject => {
                  const subTotal = subject.topics.length;
                  const subCompleted = subject.topics.filter(t => t.status === 'completed').length;
                  const subPercent = subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100);
                  const theme = getSubjectTheme(subject.name);

                  return (
                    <motion.div 
                      key={subject.id}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveSubjectId(subject.id)}
                      className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all relative overflow-hidden flex flex-col min-h-[160px]"
                    >
                      <button 
                        onClick={(e) => deleteSubject(subject.id, e)}
                        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Delete Subject"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex-1 pr-6">
                        <div className={`w-10 h-10 ${theme.bg} ${theme.color} rounded-xl flex items-center justify-center mb-3`}>
                          <theme.icon size={20} />
                        </div>
                        <h3 className="font-bold text-base text-slate-800 dark:text-white leading-snug mb-1 line-clamp-2">
                          {subject.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                          {subCompleted} / {subTotal} Topics
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-slate-400">Progress</span>
                          <span className={subPercent === 100 ? 'text-emerald-500' : theme.color}>
                            {subPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${subPercent}%` }} 
                            className={`h-full rounded-full transition-all duration-500 ${subPercent === 100 ? 'bg-emerald-500' : theme.fill}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* VIEW 2: DRILL-DOWN DETAILED TOPIC LIST (Compact) */
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={() => setActiveSubjectId(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-5 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Subjects
              </button>

              {activeSubject && activeSubjectTheme && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  
                  {/* Detailed Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`hidden sm:flex w-12 h-12 ${activeSubjectTheme.bg} ${activeSubjectTheme.color} rounded-xl items-center justify-center shrink-0`}>
                        <activeSubjectTheme.icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-1 leading-tight">{activeSubject.name}</h2>
                        <p className="text-xs font-medium text-slate-500">
                          {activeSubject.topics.filter(t => t.status === 'completed').length} of {activeSubject.topics.length} topics completed
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addTopic(activeSubject.id)}
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-bold text-xs transition-colors shrink-0"
                    >
                      <Plus size={14} /> Add Topic
                    </button>
                  </div>

                  {/* Detailed Topic List (Compact) */}
                  <div className="p-3 sm:p-5 space-y-2">
                    {activeSubject.topics.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 font-medium text-sm">No topics found. Add one above.</p>
                    ) : (
                      activeSubject.topics.map(topic => (
                        <div 
                          key={topic.id}
                          className="flex items-center justify-between py-2.5 px-3 sm:px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <button
                            onClick={() => cycleStatus(activeSubject.id, topic.id)}
                            className="flex items-center gap-3 text-left flex-1"
                          >
                            {topic.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
                            {topic.status === 'in_progress' && <Clock size={18} className="text-amber-500 shrink-0" />}
                            {topic.status === 'not_started' && <Circle size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />}

                            <span className={`text-sm font-semibold ${
                              topic.status === 'completed' 
                                ? 'line-through text-slate-400 dark:text-slate-600' 
                                : 'text-slate-700 dark:text-slate-200'
                            }`}>
                              {topic.name}
                            </span>
                          </button>

                          <div className="flex items-center gap-3 shrink-0 pl-3">
                            <span className={`hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              topic.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 
                              topic.status === 'in_progress' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' : 
                              'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {topic.status.replace('_', ' ')}
                            </span>

                            <button
                              onClick={() => deleteTopic(activeSubject.id, topic.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Topic"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}