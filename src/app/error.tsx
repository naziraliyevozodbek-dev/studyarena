'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-error/10 text-error w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold text-text-main mb-2">Something went wrong!</h2>
      <p className="text-sm text-text-secondary mb-6 font-mono bg-bg-secondary p-3 rounded-[var(--radius-card)] overflow-auto max-w-full">
        {error.message}
      </p>
      <Button onClick={() => reset()} variant="primary">
        Try again
      </Button>
    </div>
  );
}
