'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated
      } else if (user.role !== 'mentor') {
        // User is not a mentor, push them to student dashboard
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && user.role !== 'mentor')) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <Loader2 className="animate-spin text-text-tertiary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <p className="text-text-secondary">Please authenticate inside Telegram.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {children}
    </div>
  );
}
