"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Filter, StickyNote, Calendar, Paperclip, Image as ImageIcon, FileText, X, ExternalLink, Search, ChevronDown, ChevronUp, Pin, BookHeart } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, parseISO } from 'date-fns';
import { saveAttachmentBlob, getAttachmentBlob, deleteAttachmentBlob } from '@/lib/db';

type AttachmentMeta = {
  id: string;
  name: string;
  type: string;
  size: number;
};

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  dateAdded: string;
  isPinned?: boolean;
  attachments?: AttachmentMeta[];
};

type PendingAttachment = {
  meta: AttachmentMeta;
  file: File;
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

const NoteCard = ({ 
  note, 
  onDelete, 
  onTogglePin,
  blobUrls, 
  openAttachment 
}: { 
  note: Note; 
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  blobUrls: Record<string, string>;
  openAttachment: (att: AttachmentMeta) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = note.content && note.content.length > 200;

  return (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-3xl flex flex-col group relative overflow-hidden transition-all duration-300 h-fit ${
      note.isPinned 
        ? 'border-2 border-indigo-300 dark:border-indigo-700 shadow-md ring-4 ring-indigo-50/50 dark:ring-indigo-900/20' 
        : 'border border-slate-100 dark:border-slate-800 shadow-sm'
    }`}>
      
      {/* Note Header */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${getSubjectColor(note.subject)}`}>
          {note.subject}
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onTogglePin(note.id)}
            className={`p-2 rounded-xl transition-all ${
              note.isPinned 
                ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 opacity-100' 
                : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 opacity-100 md:opacity-0 md:group-hover:opacity-100'
            }`}
            title={note.isPinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin size={16} className={note.isPinned ? "fill-current" : ""} />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            title="Delete Note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-2 pr-6">
        {note.title}
      </h3>
      
      {/* Note Content with Truncation */}
      {note.content && (
        <div className="mb-4 flex-1">
          <p className={`text-slate-600 dark:text-slate-300 text-xs sm:text-sm whitespace-pre-wrap transition-all ${!isExpanded ? 'line-clamp-4' : ''}`}>
            {note.content}
          </p>
          {isLongContent && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              {isExpanded ? (
                <><ChevronUp size={14} /> Show Less</>
              ) : (
                <><ChevronDown size={14} /> Read More</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Render Saved Attachments */}
      {note.attachments && note.attachments.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {note.attachments.map((att) => {
              const isImage = att.type.startsWith('image/');
              const url = blobUrls[att.id];
              return (
                <div key={att.id} className="group/att relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {isImage ? (
                    <button 
                      onClick={() => openAttachment(att)}
                      className="w-full text-left block relative aspect-video overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800"
                    >
                      {url ? (
                        <img src={url} alt={att.name} className="w-full h-full object-cover group-hover/att:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading...</div>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => openAttachment(att)}
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
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium mt-auto">
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
  );
};

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<Note[]>('hub-notes', []);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Object URLs Cache for thumbnails and viewing
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const uniqueSubjects = Array.from(new Set(notes.map(n => n.subject)));
  if (uniqueSubjects.length === 0) uniqueSubjects.push('General', 'Thoughts');

  // Fetch blobs from IndexedDB for rendered notes
  useEffect(() => {
    let active = true;

    async function loadAttachmentUrls() {
      const newUrls: Record<string, string> = {};

      for (const note of notes) {
        if (!note.attachments) continue;
        for (const att of note.attachments) {
          if (!blobUrls[att.id]) {
            try {
              const blob = await getAttachmentBlob(att.id);
              if (blob && active) {
                newUrls[att.id] = URL.createObjectURL(blob);
              }
            } catch (err) {
              console.error(`Error loading blob for ${att.id}`, err);
            }
          }
        }
      }

      if (active && Object.keys(newUrls).length > 0) {
        setBlobUrls(prev => ({ ...prev, ...newUrls }));
      }
    }

    loadAttachmentUrls();

    return () => {
      active = false;
    };
  }, [notes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const newPending: PendingAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      newPending.push({
        meta: {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
        },
        file,
      });
    }

    setPendingAttachments(prev => [...prev, ...newPending]);
    setIsProcessingFiles(false);
    e.target.value = '';
  };

  const openAttachmentInNewTab = async (att: AttachmentMeta) => {
    try {
      let url = blobUrls[att.id];
      if (!url) {
        const blob = await getAttachmentBlob(att.id);
        if (blob) {
          url = URL.createObjectURL(blob);
          setBlobUrls(prev => ({ ...prev, [att.id]: url }));
        }
      }
      if (url) {
        window.open(url, '_blank');
      } else {
        alert("File binary not found in local storage database.");
      }
    } catch (e) {
      console.error("Failed to open attachment", e);
      alert("Could not open attachment.");
    }
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(att => att.meta.id !== id));
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim() && pendingAttachments.length === 0) return;

    for (const pending of pendingAttachments) {
      await saveAttachmentBlob(pending.meta.id, pending.file);
      const localUrl = URL.createObjectURL(pending.file);
      setBlobUrls(prev => ({ ...prev, [pending.meta.id]: localUrl }));
    }

    const savedAttachmentsMeta: AttachmentMeta[] = pendingAttachments.map(p => p.meta);

    const newNote: Note = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      subject: subject.trim() || 'General',
      dateAdded: new Date().toISOString(),
      isPinned: false, // Default newly added notes to unpinned
      attachments: savedAttachmentsMeta,
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setSubject('');
    setPendingAttachments([]);
  };

  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete?.attachments) {
      for (const att of noteToDelete.attachments) {
        await deleteAttachmentBlob(att.id);
      }
    }
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Combine Search Query & Subject Filter, then sort by pinned status and date
  const processedNotes = notes
    .filter(note => {
      const matchesSubject = activeFilter === 'All' || note.subject === activeFilter;
      
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesSubject;

      const matchesTitle = note.title.toLowerCase().includes(query);
      const matchesContent = note.content.toLowerCase().includes(query);
      const matchesAttachmentName = note.attachments?.some(att => att.name.toLowerCase().includes(query));

      return matchesSubject && (matchesTitle || matchesContent || matchesAttachmentName);
    })
    .sort((a, b) => {
      // Pinned notes come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // If pinning status is the same, sort newest first
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 md:pt-8 transition-all">
      
      <header className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <StickyNote size={32} className="text-indigo-500 shrink-0" />
            Notes & Thoughts
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2">Jot down daily ideas or study notes with attachments of any size.</p>
        </div>

        <Link 
          href="/diary" 
          className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm sm:text-base shrink-0 w-fit"
        >
          <BookHeart size={20} />
          Open Personal Diary
        </Link>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Left Column: New Note Form (Sitting close to sidebar) */}
        <div className="xl:col-span-5 xl:sticky xl:top-8">
          <form onSubmit={handleAddNote} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">New Note</h2>
            
            <input 
              type="text" 
              placeholder="Note Title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm sm:text-base"
            />
            
            <textarea 
              placeholder="Write your thoughts here..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none text-sm sm:text-base"
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

            {/* File Upload Trigger */}
            <div>
              <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer transition-colors text-xs sm:text-sm font-medium">
                <Paperclip size={18} className="text-indigo-500 shrink-0" />
                <span>{isProcessingFiles ? "Processing..." : "Attach Files (Any size)"}</span>
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

            {/* Attachment Previews Before Saving */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {pendingAttachments.map(att => (
                  <div key={att.meta.id} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 px-2.5 py-1 rounded-lg text-xs font-medium max-w-full truncate">
                    {att.meta.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                    <span className="truncate max-w-[120px]">{att.meta.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removePendingAttachment(att.meta.id)}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm sm:text-base">
              <Plus size={20} /> Save Note
            </button>
          </form>
        </div>

        {/* Right Column: Notes List */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search title, content, or attachments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Subject */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={16} className="text-slate-400 hidden sm:inline-block" />
              <select 
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl outline-none border border-slate-200 dark:border-slate-800 focus:border-indigo-500 cursor-pointer font-medium text-xs sm:text-sm"
              >
                <option value="All">All Subjects</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Grid */}
          {processedNotes.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <StickyNote size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No notes found</h3>
              <p className="text-slate-500 text-sm">
                {searchQuery || activeFilter !== 'All' ? 'Try adjusting your search query or subject filter.' : 'Jot something down to see it appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {processedNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={handleDeleteNote} 
                  onTogglePin={handleTogglePin}
                  blobUrls={blobUrls} 
                  openAttachment={openAttachmentInNewTab} 
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}