"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Filter, StickyNote, Calendar } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  dateAdded: string;
};

// Reusing the exact same color generator from the Dashboard for perfect consistency
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

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>('hub-notes', []);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Extract unique subjects for the datalist and filter dropdown
  const uniqueSubjects = Array.from(new Set(notes.map(n => n.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Thoughts');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      subject: subject.trim() || 'General',
      dateAdded: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setSubject('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const filteredNotes = activeFilter === 'All' 
    ? notes 
    : notes.filter(n => n.subject === activeFilter);

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <StickyNote size={32} className="text-indigo-500" />
          Notes & Thoughts
        </h1>
        <p className="text-slate-500 mt-2">Jot down daily ideas or subject-specific study notes.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAddNote} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">New Note</h2>
            
            <input 
              type="text" 
              placeholder="Note Title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
            />
            
            <textarea 
              placeholder="Write your thoughts here..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
            />
            
            <div className="flex gap-2">
              <input 
                list="notes-subject-list"
                placeholder="Subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
              />
              <datalist id="notes-subject-list">
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
            </div>

            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
              <Plus size={20} /> Save Note
            </button>
          </form>
        </div>

        {/* Right Column: Notes List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
              <Filter size={18} /> Filter by Subject
            </div>
            <select 
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl outline-none border border-transparent focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="All">All Notes</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <StickyNote size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No notes found</h3>
              <p className="text-slate-500">Jot something down to see it appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <div key={note.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group relative overflow-hidden">
                  
                  {/* Note Header */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${getSubjectColor(note.subject)}`}>
                      {note.subject}
                    </span>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 pr-6">
                    {note.title}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap flex-1 mb-4">
                    {note.content}
                  </p>

                  {/* Note Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-auto">
                    <Calendar size={14} />
                    {format(parseISO(note.dateAdded), 'MMM dd, yyyy - h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}