'use client';

import { useCallback, useRef, useEffect } from 'react';

// A simple synthesizer for iOS-style UI sounds
export function useSoundSystem() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize lazily to respect browser autoplay policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('click', initAudio, { once: true });
    
    return () => {
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('click', initAudio);
    };
  }, []);

  const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    if (!audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playClick = useCallback(() => {
    // Soft dull click (like iOS keyboard tap)
    playTone(150, 'sine', 0.05, 0.05);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    // Two ascending soft marimba notes
    playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(660, 'sine', 0.2, 0.1), 100);
  }, [playTone]);

  const playError = useCallback(() => {
    // Two descending buzzing notes
    playTone(300, 'triangle', 0.1, 0.05);
    setTimeout(() => playTone(200, 'triangle', 0.2, 0.05), 100);
  }, [playTone]);

  const playLevelUp = useCallback(() => {
    // Quick arpeggio
    playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(554, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(659, 'sine', 0.3, 0.1), 200);
  }, [playTone]);

  return { playClick, playSuccess, playError, playLevelUp };
}
