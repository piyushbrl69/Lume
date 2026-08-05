"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Coffee, Brain, Settings2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

type DailyStat = {
  date: string;
  secondsStudied: number;
};

type TimerMode = 'focus' | 'break';

const playAlarm = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, startTime);
      gain.gain.setValueAtTime(1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    };

    playBeep(ctx.currentTime);
    playBeep(ctx.currentTime + 0.25);
    playBeep(ctx.currentTime + 0.5);
  } catch (err) {
    console.error("Audio playback failed:", err);
  }
};

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [mounted, setMounted] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const [stats, setStats] = useLocalStorage<DailyStat[]>('study-stats', []);

  // 1. INITIAL LOAD (Deferred mounting to pass linter)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const savedEndTime = localStorage.getItem('focus-end-time');
      const savedMode = localStorage.getItem('focus-mode') as TimerMode;

      if (savedMode) setMode(savedMode);

      if (savedEndTime) {
        const endTime = parseInt(savedEndTime, 10);
        const remaining = Math.round((endTime - Date.now()) / 1000);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          localStorage.removeItem('focus-end-time');
          localStorage.removeItem('last-focus-tick');
          setTimeLeft(0);
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // 2. TICK LOGIC & DELTA STAT TRACKING
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const savedEndTime = localStorage.getItem('focus-end-time');

        if (savedEndTime) {
          const endTime = parseInt(savedEndTime, 10);
          const remaining = Math.round((endTime - now) / 1000);

          if (mode === 'focus') {
            const lastTick = parseInt(localStorage.getItem('last-focus-tick') || now.toString());
            const elapsedSeconds = Math.round((now - lastTick) / 1000);

            if (elapsedSeconds > 0) {
              setStats((prevStats) => {
                const todayISO = new Date().toISOString();
                const existingIndex = prevStats.findIndex(stat => isSameDay(parseISO(stat.date), new Date()));

                if (existingIndex >= 0) {
                  const newStats = [...prevStats];
                  newStats[existingIndex].secondsStudied += elapsedSeconds;
                  return newStats;
                } else {
                  return [...prevStats, { date: todayISO, secondsStudied: elapsedSeconds }];
                }
              });
            }
          }

          localStorage.setItem('last-focus-tick', now.toString());

          if (remaining <= 0) {
            clearInterval(interval);
            setTimeLeft(0);
            setIsRunning(false);
            localStorage.removeItem('focus-end-time');
            localStorage.removeItem('last-focus-tick');
            playAlarm();
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode, setStats]);

  // 3. TIMER CONTROLS
  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      localStorage.removeItem('focus-end-time');
      localStorage.removeItem('last-focus-tick');
    } else {
      setIsRunning(true);
      localStorage.setItem('focus-mode', mode);

      const effectiveTime = timeLeft === 0 ? (mode === 'break' ? 5 * 60 : 25 * 60) : timeLeft;

      localStorage.setItem('focus-end-time', (Date.now() + effectiveTime * 1000).toString());
      localStorage.setItem('last-focus-tick', Date.now().toString());
      if (timeLeft === 0) setTimeLeft(effectiveTime);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'break' ? 5 * 60 : 25 * 60);
    localStorage.removeItem('focus-end-time');
    localStorage.removeItem('last-focus-tick');
  };

  const setTime = (minutes: number, newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(minutes * 60);
    localStorage.setItem('focus-mode', newMode);
    localStorage.removeItem('focus-end-time');
    localStorage.removeItem('last-focus-tick');
  };

  const handleCustomSet = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (mins && mins > 0) {
      setTime(mins, 'focus');
      setCustomMinutes('');
    }
  };

  const addTime = (minutes: number) => {
    const newTime = timeLeft + minutes * 60;
    setTimeLeft(newTime);
    if (isRunning) {
      localStorage.setItem('focus-end-time', (Date.now() + newTime * 1000).toString());
    }
  };

  const minutesDisplay = Math.floor(timeLeft / 60);
  const secondsDisplay = timeLeft % 60;

  // 4. CHART DATA PREPARATION
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
  const chartData = last7Days.map(day => {
    const stat = stats.find(s => isSameDay(parseISO(s.date), day));
    return {
      label: format(day, 'EEE'),
      seconds: stat ? stat.secondsStudied : 0,
    };
  });

  const maxSeconds = Math.max(...chartData.map(d => d.seconds), 1);
  const todayTotalSeconds = chartData[6].seconds;
  const todayHours = Math.floor(todayTotalSeconds / 3600);
  const todayMinutes = Math.floor((todayTotalSeconds % 3600) / 60);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen flex flex-col">

      <header className="mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Deep Focus</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Track your dedicated study sessions.</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Studied Today</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {todayHours > 0 && `${todayHours}h `}{todayMinutes}m
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 flex-1">

        {/* Timer Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] relative">

          {/* Mode Indicator */}
          <div className={`absolute top-5 sm:top-8 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            mode === 'focus' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
          }`}>
            {mode === 'focus' ? 'Focus Mode' : 'Break Mode'}
          </div>

          <div className={`text-[3.5rem] sm:text-[6rem] md:text-[8rem] leading-none font-black tracking-tight mb-8 sm:mb-12 tabular-nums ${mode === 'break' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`} suppressHydrationWarning>
            {mounted ? `${minutesDisplay.toString().padStart(2, '0')}:${secondsDisplay.toString().padStart(2, '0')}` : "25:00"}
          </div>

          {/* Main Controls */}
          <div className="flex gap-4 mb-8 sm:mb-12">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-transform active:scale-95 ${
                isRunning
                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-500'
                  : mode === 'break'
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              {isRunning ? 'Pause' : (mode === 'break' ? 'Start Break' : 'Start Focus')}
            </button>
            <button
              onClick={resetTimer}
              className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 p-3 sm:p-4 rounded-2xl transition-transform active:scale-95"
            >
              <RotateCcw size={22} />
            </button>
          </div>

          {/* Presets & Custom */}
          <div className="w-full max-w-md border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Adjust Timer</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              <button onClick={() => setTime(25, 'focus')} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400 transition-colors">
                <Brain size={20} className="mb-1" />
                <span className="text-xs font-bold">25m</span>
              </button>
              <button onClick={() => setTime(50, 'focus')} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400 transition-colors">
                <Brain size={20} className="mb-1" />
                <span className="text-xs font-bold">50m</span>
              </button>
              <button onClick={() => setTime(5, 'break')} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 dark:bg-slate-800/50 dark:hover:bg-emerald-900/30 dark:text-slate-400 transition-colors">
                <Coffee size={20} className="mb-1" />
                <span className="text-xs font-bold">Break</span>
              </button>
              <button onClick={() => addTime(5)} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400 transition-colors">
                <Plus size={20} className="mb-1" />
                <span className="text-xs font-bold">+5m</span>
              </button>
            </div>

            {/* Custom Time Input */}
            <form onSubmit={handleCustomSet} className="flex gap-2">
              <div className="relative flex-1">
                <Settings2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  placeholder="Custom minutes..."
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                  min="1"
                />
              </div>
              <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                Set
              </button>
            </form>

          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-6">Study History</h2>

          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-between gap-2 h-40 sm:h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
              {chartData.map((data, index) => {
                const heightPercent = data.seconds === 0 ? 0 : Math.max((data.seconds / maxSeconds) * 100, 5);
                const isToday = index === 6;

                return (
                  <div key={data.label} className="relative flex flex-col items-center gap-2 flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-500 transition-opacity absolute -mt-6">
                      {Math.round(data.seconds / 60)}m
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ease-out ${isToday ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      style={{ height: `${heightPercent}%`, minHeight: data.seconds > 0 ? '4px' : '0px' }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-2">
              {chartData.map((data, index) => (
                <span key={`label-${data.label}`} className={`text-[10px] sm:text-xs font-bold ${index === 6 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {data.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Break time is excluded from study charts.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}