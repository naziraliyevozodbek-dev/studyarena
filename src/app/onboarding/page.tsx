'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OnboardingPage() {
  const { user, token, checkAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If they already onboarded locally, or are already a mentor, redirect to home
    if (localStorage.getItem('studyarena_onboarded') === 'true' || user?.role === 'mentor') {
      router.push('/');
    }
  }, [user, router]);

  const handleSelectRole = async (role: 'student' | 'mentor') => {
    if (!token) return;
    setLoading(true);
    
    try {
      if (role === 'mentor') {
        const res = await fetch('/api/user/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role })
        });
        
        if (!res.ok) {
          throw new Error('Failed to update role');
        }
      }

      localStorage.setItem('studyarena_onboarded', 'true');
      
      // Update AuthContext user state by triggering a re-check
      await checkAuth();

      if (role === 'mentor') {
        router.push('/mentor');
      } else {
        router.push('/'); // Student goes to dashboard to enter code
      }
    } catch (error) {
      console.error('Error in onboarding:', error);
      alert('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F9F9FB] dark:bg-bg-main">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen size={40} className="text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-text-main mb-2">StudyArena'ga xush kelibsiz!</h1>
        <p className="text-text-secondary text-sm mb-8">
          Ilovadan qanday maqsadda foydalanmoqchisiz? O'z rolingizni tanlang.
        </p>

        <div className="flex flex-col gap-4">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors border-2 group" 
            padding="lg"
            onClick={() => handleSelectRole('student')}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-main mb-1">Men O'quvchiman</h3>
                <p className="text-xs text-text-secondary">Kursga qo'shilaman va vazifalarni bajaraman.</p>
              </div>
            </div>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors border-2 group" 
            padding="lg"
            onClick={() => handleSelectRole('mentor')}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-main mb-1">Men Mentorman</h3>
                <p className="text-xs text-text-secondary">Kurs yarataman va o'quvchilarni boshqaraman.</p>
              </div>
            </div>
          </Card>
        </div>
        
        {loading && (
          <div className="mt-8 flex justify-center text-primary">
            <Loader2 className="animate-spin" size={30} />
          </div>
        )}
      </div>
    </div>
  );
}
