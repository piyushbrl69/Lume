"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Plus, Trash2, Link as LinkIcon, MonitorPlay, Sparkles, Bot, Code2, Wrench } from 'lucide-react';
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

export default function ToolsPage() {
  const [tools, setTools] = useLocalStorage<Tool[]>('study-tools', defaultTools);
  const [newToolName, setNewToolName] = useState('');
  const [newToolUrl, setNewToolUrl] = useState('');

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolUrl.trim()) return;

    // Ensure URL has http/https
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
    e.preventDefault(); // Prevent opening the link when deleting
    e.stopPropagation();
    setTools(tools.filter(t => t.id !== id));
  };

  const getIcon = (type: Tool['iconType'], className = "") => {
    switch (type) {
      case 'youtube': return <MonitorPlay className={`text-red-500 ${className}`} />; // Updated here
      case 'gemini': return <Sparkles className={`text-blue-500 ${className}`} />;
      case 'chatgpt': return <Bot className={`text-emerald-500 ${className}`} />;
      case 'leetcode': return <Code2 className={`text-orange-500 ${className}`} />;
      default: return <LinkIcon className={`text-indigo-500 ${className}`} />;
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Wrench className="text-indigo-500" />
          Study Tools
        </h1>
        <p className="text-slate-500 mt-2">Your quick-access arsenal of learning resources.</p>
      </header>

      {/* Add New Tool Form */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl">
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
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add
          </button>
        </form>
      </section>

      {/* Tools Grid */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tools.map(tool => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 aspect-square"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {getIcon(tool.iconType, "w-8 h-8")}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-center">
                {tool.name}
              </span>
              
              {/* Only show delete button for custom tools, or remove the condition if you want to be able to delete default ones too */}
              {tool.iconType === 'custom' && (
                <button
                  onClick={(e) => handleDeleteTool(tool.id, e)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}