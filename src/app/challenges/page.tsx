'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Trophy, Clock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function ChallengesPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id, title, description, xp_reward, deadline,
          courses (title),
          challenge_submissions (status)
        `)
        .order('deadline', { ascending: true, nullsFirst: false });
        
      if (error) throw error;
      setChallenges(data || []);
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
      <div className="flex items-center pt-4 px-4 mb-6">
        <button onClick={() => router.back()} className="mr-4 text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-main">Challenges</h1>
      </div>

      <div className="px-4">
        {challenges.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <Trophy size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Active Challenges</h2>
            <p className="text-sm text-text-secondary">Take a break! There are no challenges at the moment.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {challenges.map(ch => {
              // Find my submission status
              // Because of RLS, challenge_submissions will only contain MY submissions
              const mySub = ch.challenge_submissions?.[0];
              const isSubmitted = !!mySub;
              const statusText = isSubmitted ? (mySub.status === 'graded' ? 'Graded' : 'Submitted') : 'Active';
              
              return (
                <Link href={`/challenges/${ch.id}`} key={ch.id}>
                  <Card interactive padding="md" className="flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                      +{ch.xp_reward} XP
                    </div>
                    
                    <div className="flex justify-between items-start mb-2 pr-12">
                      <h3 className="font-semibold text-text-main text-base">{ch.title}</h3>
                    </div>
                    
                    <p className="text-xs text-text-tertiary mb-3">{ch.courses?.title}</p>
                    
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                        <Clock size={14} />
                        {ch.deadline ? new Date(ch.deadline).toLocaleDateString() : 'No Deadline'}
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                        isSubmitted 
                          ? (mySub.status === 'graded' ? 'bg-success/10 text-success' : 'bg-orange-500/10 text-orange-500')
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {statusText}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
