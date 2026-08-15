"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Menu, X, LayoutDashboard, Library, BookA, 
  StickyNote, Timer, History, Wrench, Palette 
} from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'The Hub', href: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Flashcards', href: '/flashcards', icon: <Library size={20} /> },
    { name: 'Arsenal', href: '/vocab', icon: <BookA size={20} /> },
    { name: 'Notes', href: '/notes', icon: <StickyNote size={20} /> },
    { name: 'Focus', href: '/focus', icon: <Timer size={20} /> },
    { name: 'History', href: '/history', icon: <History size={20} /> },
    { name: 'Tools', href: '/tools', icon: <Wrench size={20} /> },
  ];

  const themes: { id: Theme; label: string; swatch: string }[] = [
    { id: 'light', label: 'Light', swatch: 'bg-slate-100 border-slate-300' },
    { id: 'sepia', label: 'Sepia', swatch: 'bg-[#eaddc5] border-[#d0c1a5]' },
    { id: 'dark', label: 'Dark', swatch: 'bg-slate-800 border-slate-600' },
    { id: 'midnight', label: 'OLED', swatch: 'bg-black border-slate-800' },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Lume
        </h1>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar / Drawer */}
      <div
        className={`w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed flex flex-col transition-transform duration-500 ease-out z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 shrink-0 flex items-center justify-between group">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </motion.div>
            <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              Lume
            </h1>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setMobileOpen(false)}
                className="relative block rounded-xl outline-none"
              >
                {/* The Magic Sliding Background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* The Icon and Text */}
                <motion.div 
                  whileHover={{ x: isActive ? 0 : 4 }} // Gentle slide right on hover if not active
                  className={`relative z-10 flex items-center gap-3 px-4 py-3 font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-indigo-700 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <motion.div
                    whileHover={!isActive ? { scale: 1.1, rotate: -5 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {item.icon}
                  </motion.div>
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Theme Picker Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Palette size={14} />
              Appearance
            </div>
            
            <div className="grid grid-cols-4 gap-2 relative">
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <motion.button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={t.label}
                    className={`relative w-full aspect-square rounded-full border-2 transition-colors group overflow-hidden ${t.swatch} ${
                      isSelected 
                        ? 'border-transparent' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                    aria-label={`Switch to ${t.label} theme`}
                  >
                    {/* Animated Selection Ring */}
                    {isSelected && (
                      <motion.div 
                        layoutId="theme-selection-ring"
                        className="absolute inset-0 rounded-full border-[3px] border-indigo-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <motion.div 
              key={theme}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center text-[10px] font-medium text-slate-400"
            >
              {themes.find(t => t.id === theme)?.label} Mode
            </motion.div>
          </div>
        </div>
        
      </div>
    </>
  );
}