// app/tools/page.tsx
"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Plus, Trash2, Link as LinkIcon, MonitorPlay, Sparkles, Bot, Code2, 
  Wrench, Download, Upload, ShieldCheck, Database, RefreshCw, AlertCircle 
} from 'lucide-react';
import { exportLumeBackup, importLumeBackup } from '@/lib/backup';

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

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

export default function ToolsPage() {
  const [tools, setTools] = useLocalStorage<Tool[]>('study-tools', defaultTools);
  const [newToolName, setNewToolName] = useState('');
  const [newToolUrl, setNewToolUrl] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 sm:space-y-12 overflow-hidden">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Wrench className="text-indigo-500 shrink-0" />
          Tools & Resources
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">Quick-access study bookmarks and app data management.</p>
      </header>

      {/* Add New Tool Form - With a subtle pop-in animation */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add a New Resource</h2>
        <form onSubmit={handleAddTool} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Tool Name (e.g. Wikipedia)"
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
          />
          <input
            type="text"
            placeholder="URL (e.g. wikipedia.org)"
            value={newToolUrl}
            onChange={(e) => setNewToolUrl(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add
          </motion.button>
        </form>
      </motion.section>

      {/* Tools Grid - Staggered & Magic Layout */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quick Shortcuts</h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {/* AnimatePresence allows elements to animate out when deleted */}
          <AnimatePresence>
            {tools.map(tool => (
              <motion.a
                key={tool.id}
                layout // MAGIC LAYOUT: Other cards glide into place when one is deleted!
                variants={itemVariants}
                exit="exit"
                whileHover={{ y: -5, scale: 1.02 }} // Hover lift
                whileTap={{ scale: 0.95 }} // Squish on tap
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-center justify-center gap-3 sm:gap-4 aspect-square"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {getIcon(tool.iconType, "w-6 h-6 sm:w-8 sm:h-8")}
                </div>
                <span className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200 text-center break-words px-1">
                  {tool.name}
                </span>

                {tool.iconType === 'custom' && (
                  <button
                    onClick={(e) => handleDeleteTool(tool.id, e)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Backup & Restore Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="text-indigo-500" size={24} />
            Data Backup & Restore
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Export your study notes, IndexedDB attachments, tasks, and settings into a JSON backup.</p>
        </div>

        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-sm font-medium flex items-center gap-3 max-w-2xl ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' 
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Export Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Export Backup</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                Downloads a complete `.json` file containing notes, file attachments, and user data.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50"
            >
              {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              <span>{isExporting ? 'Exporting...' : 'Download Backup'}</span>
            </motion.button>
          </div>

          {/* Import Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
                <Upload size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Restore Backup</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                Upload a `.json` backup file to restore all your stored app data.
              </p>
            </div>

            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm cursor-pointer text-center"
            >
              {isImporting ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{isImporting ? 'Restoring...' : 'Upload & Restore File'}</span>
              <input type="file" accept=".json" onChange={handleImport} disabled={isImporting} className="hidden" />
            </motion.label>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
