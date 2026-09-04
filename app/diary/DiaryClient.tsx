"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookHeart, Lock, Unlock, Save, KeyRound, ShieldAlert, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ShieldCheck, 
  ShieldOff, AlertCircle, Bold, Italic, Palette, ShieldPlus 
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { format, addDays, subDays, parseISO } from 'date-fns';

const AUTH_KEY = 'lume-diary-auth';
const DATA_KEY = 'lume-diary-content';
const SECURED_FLAG = 'lume-diary-secured';
const RECOVERY_PAYLOAD = 'lume-diary-recovery'; 

const VALIDATION_TEXT = 'LUME_SECURE_DIARY';
const DEFAULT_KEY = 'LUME_UNSECURED_KEY';

type AppState = 'loading' | 'setup' | 'add-security' | 'recovery-reveal' | 'locked' | 'unlocked';

// Updated to support Rich Text and Titles (backward compatible with old string entries)
type DiaryEntryData = { title: string; content: string };
type DiaryEntries = Record<string, DiaryEntryData | string>; 

export default function DiaryPage() {
  const [appState, setAppState] = useState<AppState>('loading');
  
  // Settings & Auth State
  const [isSecured, setIsSecured] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [activePassword, setActivePassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [error, setError] = useState('');

  // Diary State
  const [entries, setEntries] = useState<DiaryEntries>({});
  const [activeDate, setActiveDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const existingAuth = localStorage.getItem(AUTH_KEY);
    const securedPref = localStorage.getItem(SECURED_FLAG);

    if (!existingAuth) {
      setAppState('setup');
    } else {
      if (securedPref === 'false') {
        setIsSecured(false);
        setActivePassword(DEFAULT_KEY);
        loadDiaryData(DEFAULT_KEY);
        setAppState('unlocked');
      } else {
        setIsSecured(true);
        setAppState('locked');
      }
    }
  }, []);

  // Sync ContentEditable when Date Changes
  useEffect(() => {
    if (editorRef.current && appState === 'unlocked') {
      const entry = entries[activeDate];
      const htmlContent = typeof entry === 'string' ? entry : (entry?.content || '');
      editorRef.current.innerHTML = htmlContent;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate, appState]); // Do not add `entries` here to avoid cursor jumping while typing

  // --- 2. SETUP FLOW ---
  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSecured && passwordInput.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      const keyToUse = isSecured ? passwordInput : DEFAULT_KEY;
      
      const encryptedAuth = CryptoJS.AES.encrypt(VALIDATION_TEXT, keyToUse).toString();
      localStorage.setItem(AUTH_KEY, encryptedAuth);
      localStorage.setItem(SECURED_FLAG, isSecured ? 'true' : 'false');
      
      // If we are in 'add-security' mode, we encrypt EXISTING entries. Otherwise, empty object.
      const dataToSave = appState === 'add-security' ? JSON.stringify(entries) : '{}';
      const initialContent = CryptoJS.AES.encrypt(dataToSave, keyToUse).toString();
      localStorage.setItem(DATA_KEY, initialContent);

      setActivePassword(keyToUse);

      if (isSecured) {
        const newRecoveryKey = `LUME-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setRecoveryKey(newRecoveryKey);
        
        const recoveryData = CryptoJS.AES.encrypt(passwordInput, newRecoveryKey).toString();
        localStorage.setItem(RECOVERY_PAYLOAD, recoveryData);
        
        setAppState('recovery-reveal');
      } else {
        setAppState('unlocked');
      }
      setError('');
    } catch (err) {
      setError('Failed to setup diary.');
    }
  };

  // --- 3. UNLOCK & RECOVERY FLOW ---
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;

    if (isRecoveryMode) {
      try {
        const payload = localStorage.getItem(RECOVERY_PAYLOAD) || '';
        const bytes = CryptoJS.AES.decrypt(payload, passwordInput);
        const recoveredPassword = bytes.toString(CryptoJS.enc.Utf8);

        if (recoveredPassword) {
          setError(`Your password is: ${recoveredPassword}`);
          setIsRecoveryMode(false);
          setPasswordInput('');
        } else {
          setError('Invalid Recovery Key.');
        }
      } catch (err) {
        setError('Invalid Recovery Key.');
      }
      return;
    }

    try {
      const encryptedAuth = localStorage.getItem(AUTH_KEY) || '';
      const bytes = CryptoJS.AES.decrypt(encryptedAuth, passwordInput);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      if (decryptedText === VALIDATION_TEXT) {
        setActivePassword(passwordInput);
        loadDiaryData(passwordInput);
        setError('');
        setPasswordInput('');
        setAppState('unlocked');
      } else {
        setError('Incorrect password.');
      }
    } catch (err) {
      setError('Incorrect password.');
    }
  };

  const loadDiaryData = (key: string) => {
    const encryptedContent = localStorage.getItem(DATA_KEY) || '';
    if (encryptedContent) {
      const contentBytes = CryptoJS.AES.decrypt(encryptedContent, key);
      const jsonString = contentBytes.toString(CryptoJS.enc.Utf8);
      if (jsonString) {
        setEntries(JSON.parse(jsonString));
      }
    }
  };

  // --- 4. DIARY EDITOR OPERATIONS ---
  const handleSave = () => {
    if (!activePassword) return;
    
    setIsSaving(true);
    setTimeout(() => {
      const jsonString = JSON.stringify(entries);
      const encryptedContent = CryptoJS.AES.encrypt(jsonString, activePassword).toString();
      localStorage.setItem(DATA_KEY, encryptedContent);
      setIsSaving(false);
    }, 400); 
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const current = entries[activeDate];
    const content = typeof current === 'string' ? current : (current?.content || '');
    setEntries(prev => ({
      ...prev,
      [activeDate]: { title: e.target.value, content }
    }));
  };

  const handleContentInput = () => {
    if (!editorRef.current) return;
    const current = entries[activeDate];
    const title = typeof current === 'string' ? '' : (current?.title || '');
    setEntries(prev => ({
      ...prev,
      [activeDate]: { title, content: editorRef.current!.innerHTML }
    }));
  };

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentInput();
  };

  const handleLock = () => {
    setAppState('locked');
    setActivePassword('');
    setEntries({}); 
  };

  const changeDate = (days: number) => {
    const newDate = addDays(parseISO(activeDate), days);
    setActiveDate(format(newDate, 'yyyy-MM-dd'));
  };

  // Helper to extract title safely
  const getActiveTitle = () => {
    const entry = entries[activeDate];
    if (!entry) return '';
    return typeof entry === 'string' ? '' : entry.title;
  };

  if (appState === 'loading') return null;

  return (
    <main className="p-4 sm:p-6 md:p-8 w-full min-h-screen space-y-8 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BookHeart className="text-rose-500 shrink-0" />
            Daily Diary
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            {isSecured ? 'AES-encrypted. Accessible only by you.' : 'Your private journal space.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {appState === 'unlocked' && !isSecured && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setIsSecured(true); setPasswordInput(''); setAppState('add-security'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 transition-colors"
            >
              <ShieldPlus size={16} />
              Add Password
            </motion.button>
          )}

          {appState === 'unlocked' && isSecured && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleLock}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Lock size={16} />
              Lock Diary
            </motion.button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        
        {/* --- SETUP / ADD SECURITY SCREEN --- */}
        {(appState === 'setup' || appState === 'add-security') && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto mt-12"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {appState === 'add-security' ? <ShieldPlus size={32} /> : <KeyRound size={32} />}
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {appState === 'add-security' ? 'Upgrade Security' : 'Initialize Diary'}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {appState === 'add-security' ? 'Lock your existing entries behind AES encryption.' : 'Choose how you want to secure your daily entries.'}
              </p>

              <form onSubmit={handleSetup} className="space-y-6 text-left">
                
                {appState === 'setup' && (
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      {isSecured ? <ShieldCheck className="text-emerald-500" size={20} /> : <ShieldOff className="text-slate-400" size={20} />}
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Password Protection</p>
                        <p className="text-xs text-slate-500">Encrypt data with AES-256</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsSecured(!isSecured)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isSecured ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <motion.div layout className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-sm" animate={{ x: isSecured ? 24 : 0 }} />
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {isSecured && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <input
                        type="password"
                        placeholder="Create a password..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white text-center tracking-widest ${
                          error ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      />
                      {error && <p className="text-xs text-rose-500 mt-2 font-medium text-center">{error}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  {appState === 'add-security' && (
                    <button 
                      type="button"
                      onClick={() => { setAppState('unlocked'); setError(''); }}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSecured ? 'Set Password & Continue' : 'Create Unsecured Diary'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* --- RECOVERY REVEAL SCREEN --- */}
        {appState === 'recovery-reveal' && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto mt-12"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-200 dark:border-rose-900/50 text-center">
              <AlertCircle className="text-rose-500 w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Master Recovery Key</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                If you ever forget your password, you will need this exact key to recover it. <br/>
                <strong>Lume cannot reset your password for you.</strong> Please save this somewhere safe.
              </p>

              <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-8 select-all cursor-text">
                <code className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 tracking-widest">
                  {recoveryKey}
                </code>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setAppState('unlocked')}
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-colors"
              >
                I have saved my Recovery Key
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* --- LOCK SCREEN --- */}
        {appState === 'locked' && (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto mt-12"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <KeyRound size={32} />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {isRecoveryMode ? 'Recover Password' : 'Unlock Diary'}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {isRecoveryMode 
                  ? 'Enter your Master Recovery Key (LUME-XXXX-XXXX) to reveal your password.' 
                  : 'Enter your password to decrypt your personal entries.'}
              </p>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <input
                    type={isRecoveryMode ? "text" : "password"}
                    autoFocus
                    placeholder={isRecoveryMode ? "LUME-XXXX-XXXX" : "Enter password..."}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 dark:text-white text-center tracking-widest ${
                      error && !error.includes('Your password is') ? 'border-rose-300 dark:border-rose-900/50 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {error && (
                    <p className={`text-xs mt-2 font-medium ${error.includes('Your password is') ? 'text-emerald-500 text-sm' : 'text-rose-500'}`}>
                      {error}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Unlock size={18} />
                  {isRecoveryMode ? 'Reveal Password' : 'Decrypt & Unlock'}
                </motion.button>
              </form>

              <button 
                onClick={() => { setIsRecoveryMode(!isRecoveryMode); setError(''); setPasswordInput(''); }}
                className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {isRecoveryMode ? 'Back to Login' : 'Forgot Password?'}
              </button>
            </div>
          </motion.div>
        )}

        {/* --- UNLOCKED DIARY EDITOR --- */}
        {appState === 'unlocked' && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"
          >
            {/* Nav & Action Bar */}
            <div className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => changeDate(-1)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <ChevronLeft size={20} />
                </button>
                
                <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-rose-500">
                  <CalendarIcon size={16} className="text-slate-400 mr-2 shrink-0" />
                  <input 
                    type="date" 
                    value={activeDate}
                    onChange={(e) => setActiveDate(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  />
                </div>

                <button onClick={() => changeDate(1)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                <button onClick={() => execFormat('bold')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors" title="Bold">
                  <Bold size={16} />
                </button>
                <button onClick={() => execFormat('italic')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors" title="Italic">
                  <Italic size={16} />
                </button>
                
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                
                <label className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer relative" title="Text Color">
                  <Palette size={16} />
                  <input 
                    type="color" 
                    onChange={(e) => execFormat('foreColor', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl transition-colors font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-70"
              >
                {isSaving ? (
                  <><Lock size={16} className="animate-pulse" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Entry</>
                )}
              </motion.button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-slate-900">
              
              {/* Title Input */}
              <div className="px-6 pt-6 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                <input 
                  type="text"
                  placeholder="Entry Title..."
                  value={getActiveTitle()}
                  onChange={handleTitleChange}
                  className="w-full bg-transparent text-2xl font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>

              {/* Rich Text Editor */}
              <div 
                ref={editorRef}
                contentEditable
                onInput={handleContentInput}
                className="flex-1 w-full px-6 py-4 bg-transparent outline-none text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none"
                style={{ minHeight: '200px' }}
                data-placeholder="Start typing your entry here..."
              />
              
              {/* Placeholder logic (CSS trick since empty contentEditable doesn't show standard placeholders well) */}
              {!editorRef.current?.innerHTML && (
                <div className="absolute top-24 left-6 pointer-events-none text-slate-300 dark:text-slate-600 italic">
                  Start writing your thoughts for {format(parseISO(activeDate), 'MMM do')}...
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}