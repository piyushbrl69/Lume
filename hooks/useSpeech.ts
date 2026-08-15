"use client";

import { useCallback } from 'react';

export function useSpeech(defaultLang = 'en-US', defaultRate = 0.9) {
  const speak = useCallback((text: string, lang = defaultLang, rate = defaultRate) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech before starting a new one
      window.speechSynthesis.cancel(); 
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-Speech is not supported in your browser.");
    }
  }, [defaultLang, defaultRate]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}