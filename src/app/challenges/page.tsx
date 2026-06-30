'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Trophy, Clock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function ChallengesPage() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && token) fetchChallenges();
  }, [user, token]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/challenges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
        
      if (!res.ok) throw new Error(data.error);
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center pt-4 mb-6">
        <button onClick={() => router.back()} className="mr-4 text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-main">Challenges</h1>
      </div>

      <div className="w-full">
        {challenges.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <Trophy size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Active Challenges</h2>
            <p className="text-sm text-text-secondary">Take a break! There are no challenges at the moment.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {challenges.map(ch => {
              const mySub = ch.challenge_submissions?.[0];
              const isSubmitted = !!mySub;
              const statusText = isSubmitted ? (mySub.status === 'graded' ? 'Graded' : 'Submitted') : 'Active';
              
              return (
                <Link href={`/challenges/${ch.id}`} key={ch.id}>
                  <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary/40 via-bg-secondary to-primary/10 hover:from-primary/60 hover:to-primary/30 transition-all shadow-sm">
                    <Card padding="md" className="h-full w-full rounded-[15px] border-none flex flex-col gap-3 relative overflow-hidden bg-bg-card">
                      {/* Decorative Elements */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />

                      <div className="flex justify-between items-start z-10 relative">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">{ch.courses?.title}</span>
                          </div>
                          <h3 className="font-bold text-text-main text-lg leading-tight">{ch.title}</h3>
                        </div>
                        <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-black shadow-lg shadow-yellow-500/20">
                          +{ch.xp_reward}
                        </div>
                      </div>

                      <div className="z-10 relative">
                        <p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/50 p-3 rounded-lg border border-border/50">
                          {ch.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2 z-10 relative">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-bg-secondary px-2 py-1 rounded-md">
                          <Clock size={14} />
                          {ch.deadline ? new Date(ch.deadline).toLocaleDateString() : 'No Deadline'}
                        </div>
                        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                          isSubmitted 
                            ? (mySub.status === 'graded' ? 'bg-success/10 text-success' : 'bg-orange-500/10 text-orange-500')
                            : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'
                        }`}>
                          {statusText} <ChevronRight size={14} />
                        </div>
                      </div>
                    </Card>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
