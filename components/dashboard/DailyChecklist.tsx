"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Flame, Calendar, Repeat } from 'lucide-react';
import { Task, TaskFrequency } from '@/app/page';

interface DailyChecklistProps {
  tasks: Task[];
  existingSubjects: string[];
  streakCount: number;
  onToggleTask: (id: string) => void;
  onAddTask: (text: string, subject: string, frequency: TaskFrequency) => void;
  onDeleteTask: (id: string) => void;
}

const getSubjectColor = (subject: string) => {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  ];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function DailyChecklist({ 
  tasks, 
  existingSubjects, 
  streakCount, 
  onToggleTask, 
  onAddTask, 
  onDeleteTask 
}: DailyChecklistProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [frequency, setFrequency] = useState<TaskFrequency>('once');
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const subjectToUse = newSubject.trim() || 'General';
    onAddTask(newTaskText, subjectToUse, frequency);
    setNewTaskText('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daily Mission</h2>
        
        {/* Streak Indicator */}
        <div 
          suppressHydrationWarning 
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <Flame 
            size={16} 
            className={mounted && streakCount > 0 ? "text-orange-500 fill-orange-500" : "text-slate-400"} 
          />
          <span>{mounted ? streakCount : 0} Day Streak</span>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Add a new mission..." 
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
        />
        
        <input 
          list="subject-list"
          placeholder="Subject..."
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="w-full sm:w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
        />
        <datalist id="subject-list">
          {existingSubjects.map(sub => (
            <option key={sub} value={sub} />
          ))}
        </datalist>

        {/* Frequency Select */}
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as TaskFrequency)}
          className="w-full sm:w-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 text-sm font-medium cursor-pointer"
        >
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
        </select>

        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors shrink-0 flex justify-center">
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-slate-500 py-4 text-sm italic">No missions for today. Take a break!</p>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                task.completed 
                  ? 'bg-slate-50 border-slate-100 dark:bg-slate-950/50 dark:border-slate-800/50 opacity-60' 
                  : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
              onClick={() => onToggleTask(task.id)}
            >
              <div className="flex items-center gap-4">
                <button className={`shrink-0 transition-colors ${task.completed ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-500'}`}>
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${getSubjectColor(task.subject)}`}>
                      {task.subject}
                    </span>

                    {/* Schedule Badge */}
                    {task.frequency && task.frequency !== 'once' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50 capitalize">
                        <Repeat size={10} />
                        {task.frequency}
                      </span>
                    )}
                  </div>

                  <p className={`font-medium text-sm sm:text-base ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                    {task.text}
                  </p>
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}