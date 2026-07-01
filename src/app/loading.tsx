'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-bg-base text-text-main gap-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute w-full h-full border-4 border-primary/20 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <Loader2 className="text-primary animate-pulse w-6 h-6 absolute" />
      </div>
      <p className="font-medium animate-pulse text-text-secondary text-sm">Yuklanmoqda...</p>
    </div>
  );
}
