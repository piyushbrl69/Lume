"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Filter, StickyNote, Calendar, Paperclip, Image as ImageIcon, FileText, X, ExternalLink } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';

type Attachment = {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  dataUrl: string; // Base64 data string
};

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  dateAdded: string;
  attachments?: Attachment[];
};

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const uniqueSubjects = Array.from(new Set(notes.map(n => n.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Thoughts');

  // Convert Base64 Data URL to Blob URL for viewing in a new tab
  const openAttachmentInNewTab = (att: Attachment) => {
    try {
      // Split base64 header from content
      const parts = att.dataUrl.split(';base64,');
      const contentType = parts[0].replace('data:', '');
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error("Failed to open file", e);
      alert("Could not open preview for this file.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 2 * 1024 * 1024) {
        alert(`File "${file.name}" is larger than 2MB. Please choose smaller files.`);
        continue;
      }

      try {
        const dataUrl = await readFileAsBase64(file);
        newAttachments.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        });
      } catch (err) {
        console.error("Failed to read file", err);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsProcessingFiles(false);
    e.target.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const removePendingAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && attachments.length === 0) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      subject: subject.trim() || 'General',
      dateAdded: new Date().toISOString(),
      attachments,
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setSubject('');
    setAttachments([]);
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
        <p className="text-slate-500 mt-2">Jot down daily ideas or subject-specific study notes with attachments.</p>
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
              rows={5}
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

            {/* File Attachment Upload Button */}
            <div>
              <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer transition-colors text-sm font-medium">
                <Paperclip size={18} className="text-indigo-500" />
                <span>{isProcessingFiles ? "Processing..." : "Attach Photos or Documents"}</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden" 
                  disabled={isProcessingFiles}
                />
              </label>
            </div>

            {/* Attachment Previews before saving */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-lg text-xs font-medium max-w-full truncate">
                    {att.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                    <span className="truncate max-w-[120px]">{att.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removePendingAttachment(att.id)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                  
                  {note.content && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap flex-1 mb-4">
                      {note.content}
                    </p>
                  )}

                  {/* Render Attachments */}
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {note.attachments.map((att) => {
                          const isImage = att.type.startsWith('image/');
                          return (
                            <div key={att.id} className="group/att relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                              {isImage ? (
                                <button 
                                  onClick={() => openAttachmentInNewTab(att)}
                                  className="w-full text-left block relative aspect-video overflow-hidden cursor-pointer"
                                >
                                  <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover group-hover/att:scale-105 transition-transform" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => openAttachmentInNewTab(att)}
                                  className="w-full flex items-center gap-2 p-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-left cursor-pointer"
                                >
                                  <FileText size={16} className="text-indigo-500 shrink-0" />
                                  <span className="truncate flex-1">{att.name}</span>
                                  <ExternalLink size={12} className="shrink-0 text-slate-400" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Note Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {format(parseISO(note.dateAdded), 'MMM dd, yyyy - h:mm a')}
                    </div>
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-indigo-500">
                        <Paperclip size={12} />
                        <span>{note.attachments.length}</span>
                      </div>
                    )}
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