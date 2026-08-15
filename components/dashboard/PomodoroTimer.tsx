"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WORK_TIME = 25 * 60;

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const savedEndTime = localStorage.getItem('pomodoro-end-time');
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime, 10);
        const remaining = Math.round((endTime - Date.now()) / 1000);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          localStorage.removeItem('pomodoro-end-time');
          setTimeLeft(0);
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        const savedEndTime = localStorage.getItem('pomodoro-end-time');
        if (savedEndTime) {
          const endTime = parseInt(savedEndTime, 10);
          const remaining = Math.round((endTime - Date.now()) / 1000);

          if (remaining <= 0) {
            clearInterval(interval);
            setTimeLeft(0);
            setIsRunning(false);
            localStorage.removeItem('pomodoro-end-time');
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      localStorage.removeItem('pomodoro-end-time');
    } else {
      setIsRunning(true);
      if (timeLeft === 0) {
        setTimeLeft(WORK_TIME);
        localStorage.setItem('pomodoro-end-time', (Date.now() + WORK_TIME * 1000).toString());
      } else {
        localStorage.setItem('pomodoro-end-time', (Date.now() + timeLeft * 1000).toString());
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(WORK_TIME);
    localStorage.removeItem('pomodoro-end-time');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-indigo-500 dark:bg-indigo-600 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-white">
      <h2 className="text-indigo-100 font-bold mb-4 text-sm sm:text-base">Focus Timer</h2>

      <div className="text-5xl sm:text-6xl font-black mb-6 sm:mb-8 tracking-wider" suppressHydrationWarning>
        {mounted ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : "25:00"}
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className="bg-white text-indigo-600 hover:bg-indigo-50 p-3 sm:p-4 rounded-2xl transition-transform active:scale-95"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="bg-indigo-400/50 hover:bg-indigo-400/70 text-white p-3 sm:p-4 rounded-2xl transition-transform active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
}