'use client';

import { useCallback } from 'react';

export function useHaptic() {
  const isAvailable = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback;

  const impact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    if (isAvailable) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  }, [isAvailable]);

  const notification = useCallback((type: 'error' | 'success' | 'warning') => {
    if (isAvailable) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  }, [isAvailable]);

  const selection = useCallback(() => {
    if (isAvailable) {
      (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  }, [isAvailable]);

  return { impact, notification, selection };
}
