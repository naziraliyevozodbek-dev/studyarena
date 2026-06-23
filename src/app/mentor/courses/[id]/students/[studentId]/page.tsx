'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, BookOpen, AlertTriangle, Target, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function StudentAnalytics({ params }: { params: Promise<{ id: string, studentId: string }> }) {
  const resolvedParams = use(params);

  const router = useRouter();
  const { user, token } = useAuth();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'mentor') {
      router.push('/');
      return;
    }
    
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/mentor/analytics?courseId=${resolvedParams.id}&studentId=${resolvedParams.studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, token, resolvedParams.id, resolvedParams.studentId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <p>Student not found or unauthorized.</p>
      </div>
    );
  }

  // Calculate max words for chart scaling
  const maxWords = Math.max(...(analytics.chartData?.map((d: any) => d.words) || [1]));

  return (
    <div className="animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-primary active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Back to Course</span>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main mb-1">Student Analytics</h1>
        <p className="text-sm text-text-secondary">Track vocabulary progress and activity.</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card padding="md" className="flex flex-col border-border/50 bg-bg-card">
          <div className="text-primary mb-2 bg-primary/10 w-fit p-2 rounded-lg"><BookOpen size={20} /></div>
          <div className="text-2xl font-bold text-text-main">
            {analytics.learnedWords} <span className="text-sm font-medium text-text-tertiary">/ {analytics.totalWords}</span>
          </div>
          <div className="text-xs text-text-secondary font-medium">Words Learned</div>
        </Card>
        
        <Card padding="md" className="flex flex-col border-border/50 bg-bg-card">
          <div className="text-success mb-2 bg-success/10 w-fit p-2 rounded-lg"><Target size={20} /></div>
          <div className="text-2xl font-bold text-text-main">{analytics.accuracy}%</div>
          <div className="text-xs text-text-secondary font-medium">Accuracy</div>
        </Card>

        <Card padding="md" className="flex flex-col border-border/50 bg-bg-card">
          <div className="text-error mb-2 bg-error/10 w-fit p-2 rounded-lg"><AlertTriangle size={20} /></div>
          <div className="text-2xl font-bold text-text-main">{analytics.weakWordsCount}</div>
          <div className="text-xs text-text-secondary font-medium">Weak Words</div>
        </Card>

        <Card padding="md" className="flex flex-col border-border/50 bg-bg-card">
          <div className="text-text-tertiary mb-2 bg-bg-secondary w-fit p-2 rounded-lg"><Clock size={20} /></div>
          <div className="text-lg font-bold text-text-main truncate">
            {analytics.lastActivity === 'Never' ? 'Never' : new Date(analytics.lastActivity).toLocaleDateString()}
          </div>
          <div className="text-xs text-text-secondary font-medium">Last Activity</div>
        </Card>
      </div>

      {/* Activity Chart */}
      <h2 className="text-lg font-semibold text-text-main mb-3 flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" /> Learning Activity (7 Days)
      </h2>
      <Card padding="md" className="mb-8">
        <div className="h-40 flex items-end justify-between gap-2 pt-4">
          {analytics.chartData?.map((data: any, i: number) => {
            const heightPercentage = data.words > 0 ? Math.max((data.words / maxWords) * 100, 10) : 0;
            return (
              <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                <div className="relative w-full flex justify-center h-full items-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-text-main text-white text-[10px] py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                    {data.words} words
                  </div>
                  {/* Bar */}
                  <div 
                    className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ${data.words > 0 ? 'bg-primary' : 'bg-bg-secondary'}`}
                    style={{ height: `${heightPercentage}%` }}
                  />
                </div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">{data.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Weak Words */}
      <h2 className="text-lg font-semibold text-text-main mb-3 flex items-center gap-2">
        <AlertTriangle size={20} className="text-error" /> Top Difficult Words
      </h2>
      <Card padding="none">
        {analytics.topWeakWords?.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-6">No difficult words identified yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {analytics.topWeakWords.map((ww: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-3 px-4 bg-bg-card">
                <div>
                  <span className="font-semibold text-text-main block">{ww.vocabularies.german_word}</span>
                  <span className="text-xs text-text-secondary">{ww.vocabularies.translation}</span>
                </div>
                <div className="text-right">
                  <span className="text-error font-bold text-sm">{ww.mistakes_count}</span>
                  <span className="text-xs text-text-tertiary block">mistakes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
