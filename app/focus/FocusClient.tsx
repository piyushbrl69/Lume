"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Coffee, Brain, Settings2, ChevronLeft, ChevronRight, Timer, Clock, ArrowLeft } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

type DailyStat = {
  date: string;
  secondsStudied: number;
  hourlyBreakdown?: Record<number, number>;
};

type TimerMode = 'focus' | 'break' | 'stopwatch';

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
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [mounted, setMounted] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const [stats, setStats] = useLocalStorage<DailyStat[]>('study-stats', []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ date: Date; stat?: DailyStat } | null>(null);

  // 1. INITIAL LOAD
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const savedMode = (localStorage.getItem('focus-mode') as TimerMode) || 'focus';
      setMode(savedMode);

      if (savedMode === 'stopwatch') {
        const savedStart = localStorage.getItem('stopwatch-start-time');
        const savedAccumulated = parseInt(localStorage.getItem('stopwatch-accumulated') || '0', 10);
        const wasRunning = localStorage.getItem('stopwatch-running') === 'true';

        if (wasRunning && savedStart) {
          const elapsed = Math.round((Date.now() - parseInt(savedStart, 10)) / 1000);
          setStopwatchSeconds(savedAccumulated + elapsed);
          setIsRunning(true);
        } else {
          setStopwatchSeconds(savedAccumulated);
        }
      } else {
        const savedEndTime = localStorage.getItem('focus-end-time');
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
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // 2. TICK LOGIC & HOURLY TRACKING
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const currentHour = new Date().getHours();

        if (mode === 'stopwatch') {
          const lastTick = parseInt(localStorage.getItem('last-focus-tick') || now.toString());
          const elapsedSeconds = Math.round((now - lastTick) / 1000);

          if (elapsedSeconds > 0) {
            setStopwatchSeconds(prev => prev + elapsedSeconds);

            setStats(prevStats => {
              const todayISO = new Date().toISOString();
              const existingIndex = prevStats.findIndex(stat => isSameDay(parseISO(stat.date), new Date()));

              if (existingIndex >= 0) {
                const newStats = [...prevStats];
                const current = newStats[existingIndex];
                current.secondsStudied += elapsedSeconds;
                current.hourlyBreakdown = current.hourlyBreakdown || {};
                current.hourlyBreakdown[currentHour] = (current.hourlyBreakdown[currentHour] || 0) + elapsedSeconds;
                return newStats;
              } else {
                return [...prevStats, { 
                  date: todayISO, 
                  secondsStudied: elapsedSeconds,
                  hourlyBreakdown: { [currentHour]: elapsedSeconds }
                }];
              }
            });
          }

          localStorage.setItem('last-focus-tick', now.toString());
        } else {
          const savedEndTime = localStorage.getItem('focus-end-time');

          if (savedEndTime) {
            const endTime = parseInt(savedEndTime, 10);
            const remaining = Math.round((endTime - now) / 1000);

            if (mode === 'focus') {
              const lastTick = parseInt(localStorage.getItem('last-focus-tick') || now.toString());
              const elapsedSeconds = Math.round((now - lastTick) / 1000);

              if (elapsedSeconds > 0) {
                setStats(prevStats => {
                  const todayISO = new Date().toISOString();
                  const existingIndex = prevStats.findIndex(stat => isSameDay(parseISO(stat.date), new Date()));

                  if (existingIndex >= 0) {
                    const newStats = [...prevStats];
                    const current = newStats[existingIndex];
                    current.secondsStudied += elapsedSeconds;
                    current.hourlyBreakdown = current.hourlyBreakdown || {};
                    current.hourlyBreakdown[currentHour] = (current.hourlyBreakdown[currentHour] || 0) + elapsedSeconds;
                    return newStats;
                  } else {
                    return [...prevStats, { 
                      date: todayISO, 
                      secondsStudied: elapsedSeconds,
                      hourlyBreakdown: { [currentHour]: elapsedSeconds }
                    }];
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
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode, setStats]);

  // 3. TIMER & STOPWATCH CONTROLS
  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      localStorage.removeItem('focus-end-time');
      localStorage.removeItem('last-focus-tick');
      if (mode === 'stopwatch') {
        localStorage.setItem('stopwatch-running', 'false');
        localStorage.setItem('stopwatch-accumulated', stopwatchSeconds.toString());
      }
    } else {
      setIsRunning(true);
      localStorage.setItem('focus-mode', mode);

      if (mode === 'stopwatch') {
        localStorage.setItem('stopwatch-running', 'true');
        localStorage.setItem('stopwatch-start-time', Date.now().toString());
        localStorage.setItem('last-focus-tick', Date.now().toString());
      } else {
        const effectiveTime = timeLeft === 0 ? (mode === 'break' ? 5 * 60 : 25 * 60) : timeLeft;
        localStorage.setItem('focus-end-time', (Date.now() + effectiveTime * 1000).toString());
        localStorage.setItem('last-focus-tick', Date.now().toString());
        if (timeLeft === 0) setTimeLeft(effectiveTime);
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    localStorage.removeItem('focus-end-time');
    localStorage.removeItem('last-focus-tick');

    if (mode === 'stopwatch') {
      setStopwatchSeconds(0);
      localStorage.removeItem('stopwatch-start-time');
      localStorage.setItem('stopwatch-accumulated', '0');
      localStorage.setItem('stopwatch-running', 'false');
    } else {
      setTimeLeft(mode === 'break' ? 5 * 60 : 25 * 60);
    }
  };

  const setTime = (minutes: number, newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(minutes * 60);
    localStorage.setItem('focus-mode', newMode);
    localStorage.removeItem('focus-end-time');
    localStorage.removeItem('last-focus-tick');
  };

  const activateStopwatch = () => {
    setIsRunning(false);
    setMode('stopwatch');
    localStorage.setItem('focus-mode', 'stopwatch');
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
    if (mode === 'stopwatch') {
      setStopwatchSeconds(prev => prev + minutes * 60);
      return;
    }
    const newTime = timeLeft + minutes * 60;
    setTimeLeft(newTime);
    if (isRunning) {
      localStorage.setItem('focus-end-time', (Date.now() + newTime * 1000).toString());
    }
  };

  const displaySeconds = mode === 'stopwatch' ? stopwatchSeconds : timeLeft;
  const minutesDisplay = Math.floor(displaySeconds / 60);
  const secondsDisplay = displaySeconds % 60;

  // 4. CHART DATA PREPARATION
  const baseDate = subDays(new Date(), weekOffset * 7);
  const selected7Days = Array.from({ length: 7 }).map((_, i) => subDays(baseDate, 6 - i));
  
  const chartData = selected7Days.map(day => {
    const stat = stats.find(s => isSameDay(parseISO(s.date), day));
    return {
      date: day,
      stat,
      label: format(day, 'EEE'),
      seconds: stat ? stat.secondsStudied : 0,
    };
  });

  const maxSeconds = Math.max(...chartData.map(d => d.seconds), 1);
  
  const todayStat = stats.find(s => isSameDay(parseISO(s.date), new Date()));
  const todayTotalSeconds = todayStat ? todayStat.secondsStudied : 0;
  const todayHours = Math.floor(todayTotalSeconds / 3600);
  const todayMinutes = Math.floor((todayTotalSeconds % 3600) / 60);

  const lifetimeSeconds = stats.reduce((acc, stat) => acc + stat.secondsStudied, 0);
  const lifetimeHours = Math.floor(lifetimeSeconds / 3600);

  const formatStudyTime = (totalSeconds: number) => {
    const totalMins = Math.round(totalSeconds / 60);
    if (totalMins === 0) return '0m';
    if (totalMins < 60) return `${totalMins}m`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Keep selectedDayDetail synced with real-time stats if viewing today
  const activeDayStat = selectedDayDetail 
    ? stats.find(s => isSameDay(parseISO(s.date), selectedDayDetail.date))
    : null;

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
          {lifetimeHours > 0 && (
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">
              {lifetimeHours}h Lifetime Total
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 flex-1">

        {/* Timer & Stopwatch Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] relative">

          {/* Mode Indicator Badge */}
          <div className={`absolute top-5 sm:top-8 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            mode === 'focus' 
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
              : mode === 'stopwatch'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
          }`}>
            {mode === 'focus' ? 'Focus Mode' : mode === 'stopwatch' ? 'Stopwatch Active' : 'Break Mode'}
          </div>

          {/* Large Digital Display */}
          <div className={`text-[3.5rem] sm:text-[6rem] md:text-[8rem] leading-none font-black tracking-tight mb-8 sm:mb-12 tabular-nums ${
            mode === 'break' 
              ? 'text-emerald-500 dark:text-emerald-400' 
              : mode === 'stopwatch'
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-slate-800 dark:text-white'
          }`} suppressHydrationWarning>
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
                    : mode === 'stopwatch'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRunning ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              {isRunning ? 'Pause' : (mode === 'break' ? 'Start Break' : mode === 'stopwatch' ? 'Start Stopwatch' : 'Start Focus')}
            </button>
            <button
              onClick={resetTimer}
              className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 p-3 sm:p-4 rounded-2xl transition-transform active:scale-95"
            >
              <RotateCcw size={22} />
            </button>
          </div>

          {/* Presets, Stopwatch & Custom Input */}
          <div className="w-full max-w-md border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Adjust Timer</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
              <button 
                onClick={() => setTime(25, 'focus')} 
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${mode === 'focus' && timeLeft === 25 * 60 ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-bold border border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400'}`}
              >
                <Brain size={20} className="mb-1" />
                <span className="text-xs font-bold">25m</span>
              </button>

              <button 
                onClick={() => setTime(50, 'focus')} 
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${mode === 'focus' && timeLeft === 50 * 60 ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-bold border border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400'}`}
              >
                <Brain size={20} className="mb-1" />
                <span className="text-xs font-bold">50m</span>
              </button>

              <button 
                onClick={() => setTime(5, 'break')} 
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${mode === 'break' ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 dark:bg-slate-800/50 dark:hover:bg-emerald-900/30 dark:text-slate-400'}`}
              >
                <Coffee size={20} className="mb-1" />
                <span className="text-xs font-bold">Break</span>
              </button>

              <button 
                onClick={activateStopwatch} 
                className={`flex flex-col items-center p-3 rounded-xl transition-colors ${mode === 'stopwatch' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 font-bold border border-amber-200 dark:border-amber-800' : 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 dark:bg-slate-800/50 dark:hover:bg-amber-900/30 dark:text-slate-400'}`}
                title="Stopwatch Mode"
              >
                <Timer size={20} className="mb-1" />
                <span className="text-xs font-bold">Stopwatch</span>
              </button>

              <button 
                onClick={() => addTime(5)} 
                className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 dark:text-slate-400 transition-colors"
              >
                <Plus size={20} className="mb-1" />
                <span className="text-xs font-bold">+5m</span>
              </button>
            </div>

            <form onSubmit={handleCustomSet} className="flex gap-2 mt-3">
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

        {/* Analytics Card: Toggles Between Week Chart and Day Breakdown Inline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          
          {selectedDayDetail ? (
            /* INLINE DAY DETAIL VIEW */
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <button
                  onClick={() => setSelectedDayDetail(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back to Week
                </button>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Hourly Distribution
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-indigo-500" />
                  {format(selectedDayDetail.date, 'EEEE, MMM do')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total Studied: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatStudyTime(activeDayStat?.secondsStudied || selectedDayDetail.stat?.secondsStudied || 0)}</span>
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-start">
                {(() => {
                  const currentBreakdown = activeDayStat?.hourlyBreakdown || selectedDayDetail.stat?.hourlyBreakdown;
                  const activeHours = currentBreakdown 
                    ? Object.entries(currentBreakdown).filter(([_, secs]) => Number(secs) > 0)
                    : [];

                  if (activeHours.length > 0) {
                    return (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {Array.from({ length: 24 }).map((_, hour) => {
                          const secs = currentBreakdown?.[hour] || 0;
                          if (secs === 0) return null;

                          const formattedHour = format(new Date().setHours(hour, 0, 0, 0), 'ha');
                          const percent = Math.min(100, Math.round((secs / 3600) * 100));

                          return (
                            <div key={hour} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-xs">
                              <span className="w-12 font-bold text-slate-500 dark:text-slate-400 shrink-0">{formattedHour}</span>
                              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="w-12 text-right font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                {formatStudyTime(secs)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 font-medium px-4">
                        {selectedDayDetail.stat ? "Session recorded before hourly tracking was active." : "No study sessions recorded for this day."}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => setSelectedDayDetail(null)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  Return to Overview
                </button>
              </div>
            </div>
          ) : (
            /* DEFAULT 7-DAY BAR CHART VIEW */
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Study History</h2>
                  <p className="text-[11px] text-slate-400">Click a day for hourly distribution</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Previous Week"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 w-[60px] text-center uppercase tracking-wider">
                    {weekOffset === 0 ? 'Current' : `${weekOffset}w ago`}
                  </span>
                  <button 
                    onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                    disabled={weekOffset === 0}
                    className={`p-1.5 rounded-lg transition-colors ${weekOffset === 0 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    title="Next Week"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-2 h-40 sm:h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {chartData.map((data, index) => {
                    const heightPercent = data.seconds === 0 ? 0 : Math.max((data.seconds / maxSeconds) * 100, 5);
                    const isActualToday = weekOffset === 0 && index === 6;

                    return (
                      <button 
                        key={index} 
                        onClick={() => setSelectedDayDetail({ date: data.date, stat: data.stat })}
                        className="relative flex flex-col justify-end items-center gap-1 flex-1 group h-full cursor-pointer outline-none focus:scale-105 transition-transform"
                        title={`View hourly breakdown for ${format(data.date, 'EEEE, MMM do')}`}
                      >
                        <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-500 transition-opacity mb-1 whitespace-nowrap z-10 pointer-events-none">
                          {formatStudyTime(data.seconds)}
                        </div>
                        <div
                          className={`w-full max-w-[36px] rounded-t-md transition-all duration-300 group-hover:brightness-110 ${isActualToday ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                          style={{ height: `${heightPercent}%`, minHeight: data.seconds > 0 ? '4px' : '0px' }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-2">
                  {chartData.map((data, index) => (
                    <span key={`label-${index}`} className={`text-[10px] sm:text-xs font-bold text-center flex-1 ${weekOffset === 0 && index === 6 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
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
            </>
          )}

        </div>

      </div>
    </main>
  );
}