'use client';

import { useAuth } from '@/context/AuthContext';
import MentorNav from '@/components/MentorNav';
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Please authenticate inside Telegram.</p>
      </div>
    );
  }

  return (
    <div className="saas-container">
      <div className="saas-content">
        {children}
      </div>
      <MentorNav />
    </div>
  );
}
