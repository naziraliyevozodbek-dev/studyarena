'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, X, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomeworkReview({ params }: { params: Promise<{ id: string, homeworkId: string }> }) {
  const resolvedParams = use(params);

  const { user, token } = useAuth();
  const router = useRouter();
  const [homework, setHomework] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'mentor') {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, router, resolvedParams.homeworkId]);

  const fetchData = async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/homeworks/${resolvedParams.homeworkId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setHomework(data.homework);
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId: string, status: 'graded' | 'rejected') => {
    setGradingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error('Failed to grade');
      
      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status } : s
      ));
    } catch (error) {
      console.error('Grading error:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setGradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <h1 className="text-xl font-bold mb-2">Vazifa topilmadi</h1>
        <Button onClick={() => router.back()}>Orqaga qaytish</Button>
      </div>
    );
  }

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;

  return (
    <div className="animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 px-4 mb-6">
        <button 
          onClick={() => router.push(`/mentor/courses/${resolvedParams.id}`)} 
          className="text-primary active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Course</span>
          </div>
        </button>
      </div>

      <div className="px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-main leading-tight mb-2">{homework.title}</h1>
          <p className="text-sm font-medium text-text-secondary mb-4">{homework.courses?.title}</p>
          <div className="flex gap-4 mb-2">
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
              +{homework.xp_reward} XP
            </span>
            <span className="text-sm font-bold text-warning bg-warning/10 px-3 py-1 rounded-full whitespace-nowrap">
              {pendingCount} Pending
            </span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-text-main mb-4">Submissions</h2>
        
        {submissions.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <p className="text-text-secondary text-sm">Hech qanday javob yuborilmagan.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {submissions.map((submission) => (
              <Card key={submission.id} padding="md" className={submission.status === 'submitted' ? 'border-l-4 border-l-warning' : 'opacity-80'}>
                <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center border border-border">
                    {submission.users?.avatar_url ? (
                      <img src={submission.users.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-text-tertiary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-main">{submission.users?.full_name || 'Unknown Student'}</h3>
                    <p className="text-xs text-text-secondary">
                      {new Date(submission.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {submission.status === 'graded' && <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">Approved</span>}
                    {submission.status === 'rejected' && <span className="text-xs font-bold text-error bg-error/10 px-2 py-1 rounded">Rejected</span>}
                    {submission.status === 'submitted' && <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded">Pending</span>}
                  </div>
                </div>

                <div className="mb-4">
                  {submission.content.startsWith('http') ? (
                    <div className="rounded-lg overflow-hidden border border-border bg-bg-secondary">
                      <img src={submission.content} alt="Homework" className="w-full h-auto max-h-96 object-contain" />
                    </div>
                  ) : (
                    <p className="text-text-main text-sm bg-bg-secondary p-3 rounded-lg whitespace-pre-wrap">
                      {submission.content}
                    </p>
                  )}
                </div>

                {submission.status === 'submitted' && (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-error text-error active:bg-error/10"
                      onClick={() => handleGrade(submission.id, 'rejected')}
                      disabled={gradingId !== null}
                    >
                      {gradingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : <><X size={18} className="mr-2" /> Reject</>}
                    </Button>
                    <Button 
                      className="flex-1 bg-success hover:bg-success-hover text-white"
                      onClick={() => handleGrade(submission.id, 'graded')}
                      disabled={gradingId !== null}
                    >
                      {gradingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={18} className="mr-2" /> Approve</>}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
