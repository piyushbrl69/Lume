"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import { LayoutDashboard, Library, BookA, StickyNote, Timer, History, Wrench } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'The Hub', href: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Flashcards', href: '/flashcards', icon: <Library size={20} /> },
    { name: 'Arsenal', href: '/vocab', icon: <BookA size={20} /> },
    { name: 'Notes', href: '/notes', icon: <StickyNote size={20} /> },
    { name: 'Focus', href: '/focus', icon: <Timer size={20} /> },
    { name: 'History', href: '/history', icon: <History size={20} /> },
    { name: 'Tools', href: '/tools', icon: <Wrench size={20} /> }, // Added Tools Link
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed flex flex-col transition-colors duration-300 z-50">
      <div className="p-6 shrink-0">
        <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          Lume
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:text-slate-400'
              }`}>
                {item.icon}
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-white flex items-center justify-center text-xs text-white dark:text-slate-800 font-bold">
              {theme === 'light' ? 'N' : 'L'}
            </div>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  );
}