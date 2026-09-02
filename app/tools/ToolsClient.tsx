"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Link as LinkIcon, MonitorPlay, Sparkles, Bot, Code2, 
  Wrench, Download, Upload, ShieldCheck, Database, RefreshCw, AlertCircle, GripVertical 
} from 'lucide-react';
import { exportLumeBackup, importLumeBackup } from '@/lib/backup';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Tool = {
  id: string;
  name: string;
  url: string;
  iconType: 'youtube' | 'gemini' | 'chatgpt' | 'leetcode' | 'custom';
};

const defaultTools: Tool[] = [
  { id: 'default-1', name: 'ChatGPT', url: 'https://chat.openai.com', iconType: 'chatgpt' },
  { id: 'default-2', name: 'Gemini', url: 'https://gemini.google.com', iconType: 'gemini' },
  { id: 'default-3', name: 'YouTube', url: 'https://youtube.com', iconType: 'youtube' },
  { id: 'default-4', name: 'LeetCode', url: 'https://leetcode.com', iconType: 'leetcode' },
];

function SortableToolCard({
  tool,
  getIcon,
  onDelete,
}: {
  tool: Tool;
  getIcon: (type: Tool['iconType'], className?: string) => React.ReactNode;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tool.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 select-none"
    >
      {/* Drag Handle — only this element is draggable now */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-1 rounded transition-colors flex items-center justify-center touch-none"
        aria-label={`Drag to reorder ${tool.name}`}
      >
        <GripVertical size={16} />
      </button>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
        {getIcon(tool.iconType, "w-5 h-5")}
      </div>

      {/* Name & Link */}
      <a 
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 font-semibold text-sm text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate outline-none"
      >
        {tool.name}
      </a>

      {/* Delete Button */}
      {tool.iconType === 'custom' && (
        <button
          onClick={(e) => onDelete(tool.id, e)}
          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function ToolsPage() {
  const [tools, setTools] = useLocalStorage<Tool[]>('study-tools', defaultTools);
  const [newToolName, setNewToolName] = useState('');
  const [newToolUrl, setNewToolUrl] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // avoids hijacking simple clicks on the link/delete button
    })
  );

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolUrl.trim()) return;

    let formattedUrl = newToolUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newTool: Tool = {
      id: Date.now().toString(),
      name: newToolName.trim(),
      url: formattedUrl,
      iconType: 'custom',
    };

    setTools([...tools, newTool]);
    setNewToolName('');
    setNewToolUrl('');
  };

  const handleDeleteTool = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTools(tools.filter(t => t.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTools((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const getIcon = (type: Tool['iconType'], className = "") => {
    switch (type) {
      case 'youtube': return <MonitorPlay className={`text-red-500 ${className}`} />;
      case 'gemini': return <Sparkles className={`text-blue-500 ${className}`} />;
      case 'chatgpt': return <Bot className={`text-emerald-500 ${className}`} />;
      case 'leetcode': return <Code2 className={`text-orange-500 ${className}`} />;
      default: return <LinkIcon className={`text-indigo-500 ${className}`} />;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setStatusMessage(null);
      await exportLumeBackup();
      setStatusMessage({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to create backup.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Importing a backup will overwrite current local notes and settings. Continue?")) {
      e.target.value = '';
      return;
    }
    try {
      setIsImporting(true);
      setStatusMessage(null);
      await importLumeBackup(file);
      setStatusMessage({ type: 'success', text: 'Backup restored! Reloading app...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Invalid or corrupted backup file.' });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 overflow-hidden">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Wrench className="text-indigo-500 shrink-0" />
          Tools & Resources
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Manage app data and quick-access study bookmarks.</p>
      </header>

      {/* Backup & Restore Section */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Database className="text-slate-400" size={18} />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Data Management</h2>
        </div>

        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-3 max-w-2xl ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' 
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">Export Backup</h3>
              <p className="text-xs text-slate-500">Download `.json` file</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={isExporting}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
            >
              {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export</span>
            </motion.button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-0.5">Restore Backup</h3>
              <p className="text-xs text-slate-500">Upload `.json` file</p>
            </div>
            <motion.label 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm cursor-pointer"
            >
              {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>Restore</span>
              <input type="file" accept=".json" onChange={handleImport} disabled={isImporting} className="hidden" />
            </motion.label>
          </div>
        </div>
      </motion.section>

      <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-4" />

      {/* Add New Tool Form */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add Quick Link</h2>
        <form onSubmit={handleAddTool} className="flex flex-col sm:flex-row gap-3 max-w-4xl">
          <input
            type="text"
            placeholder="Tool Name (e.g. Wikipedia)"
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm shadow-sm"
          />
          <input
            type="text"
            placeholder="URL (e.g. wikipedia.org)"
            value={newToolUrl}
            onChange={(e) => setNewToolUrl(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm shadow-sm"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            Add
          </motion.button>
        </form>
      </motion.section>

      {/* Tools Grid — 2D-aware drag reordering via dnd-kit */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500">Drag handle to reorder</h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tools.map((t) => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
              <AnimatePresence>
                {tools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <SortableToolCard tool={tool} getIcon={getIcon} onDelete={handleDeleteTool} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </main>
  );
}