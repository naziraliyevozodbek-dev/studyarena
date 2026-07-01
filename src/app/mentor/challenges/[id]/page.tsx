'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, X, FileText, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function MentorChallengeDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, token } = useAuth();
  const router = useRouter();

  const [challenge, setChallenge] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'mentor') {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, router, resolvedParams.id]);

  const fetchData = async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/mentor/challenges/${resolvedParams.id}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load challenge details');
      
      const data = await res.json();
      setChallenge(data.challenge);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
      toast.error('Maʼlumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId: string, status: 'graded' | 'rejected', feedback?: string) => {
    setGradingId(submissionId);
    try {
      const res = await fetch(`/api/mentor/challenges/${resolvedParams.id}/submissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId, status, feedback })
      });
      
      if (!res.ok) throw new Error('Baholashda xatolik yuz berdi');
      
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status } : s
      ));
      setShowRejectInput(null);
      setRejectReason('');
      toast.success(`Javob ${status === 'graded' ? 'qabul qilindi' : 'qaytarildi'}!`);
    } catch (err: any) {
      toast.error(err.message);
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

  return (
    <div className="animate-fade-in pb-24 relative">
      <div className="flex items-center pt-4 mb-6 sticky top-0 bg-bg-base z-40 py-4">
        <button onClick={() => router.back()} className="mr-4 text-primary">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-main leading-tight">{challenge?.title}</h1>
          <p className="text-xs text-text-secondary">{challenge?.courses?.title}</p>
        </div>
      </div>

      <div className="w-full">
        {submissions.length === 0 ? (
          <Card padding="lg" className="text-center border-dashed">
            <h2 className="text-lg font-semibold text-text-main mb-2">Hali javoblar yo'q</h2>
            <p className="text-sm text-text-secondary">O'quvchilar bu challenge uchun natija yuborishmagan.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map(submission => {
              let parsed: any = null;
              if (submission.content) {
                try {
                  parsed = JSON.parse(submission.content);
                } catch {
                  parsed = { 
                    files: submission.content.startsWith('http') ? [submission.content] : [], 
                    description: submission.content.startsWith('http') ? '' : submission.content 
                  };
                }
              }

              return (
                <Card key={submission.id} padding="md" className={`flex flex-col gap-4 border-2 transition-all ${submission.status === 'graded' ? 'border-success' : submission.status === 'rejected' ? 'border-error' : 'border-primary/20'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {submission.users?.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-semibold text-text-main">{submission.users?.full_name || 'O\'quvchi'}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      submission.status === 'graded' ? 'bg-success/10 text-success' :
                      submission.status === 'rejected' ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {submission.status === 'graded' ? 'Qabul qilingan' : 
                       submission.status === 'rejected' ? 'Qaytarilgan' : 'Kutmoqda'}
                    </span>
                  </div>
                  
                  {parsed && (
                    <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                      {parsed.description && (
                        <p className="text-sm text-text-main whitespace-pre-wrap mb-3">{parsed.description}</p>
                      )}
                      
                      {parsed.files && parsed.files.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {parsed.files.map((url: string, idx: number) => {
                            const isPdf = url.includes('.pdf');
                            const isAudio = url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a');
                            
                            if (isPdf) {
                              return (
                                <a href={url} target="_blank" key={idx} className="rounded-lg border border-border bg-bg-card aspect-square flex flex-col items-center justify-center p-2 text-center text-red-500 hover:bg-bg-secondary transition-colors">
                                  <FileText size={32} className="mb-2" />
                                  <span className="text-[10px] font-medium break-all">Hujjat</span>
                                </a>
                              );
                            }
                            if (isAudio) {
                              return (
                                <div key={idx} className="rounded-lg border border-border bg-bg-card aspect-square flex flex-col items-center justify-center p-2">
                                  <Headphones size={24} className="mb-2 text-purple-500" />
                                  <audio controls src={url} className="w-full h-8 max-w-[150px]" />
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className="rounded-lg overflow-hidden border border-border bg-bg-card aspect-square relative cursor-pointer" onClick={() => setZoomImage(url)}>
                                <Image src={url} width={300} height={200} alt={`Fayl ${idx+1}`} className="w-full h-full object-cover" />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {submission.status === 'submitted' && (
                    <div className="flex flex-col gap-3 mt-2">
                      {showRejectInput === submission.id ? (
                        <div className="animate-fade-in flex flex-col gap-2">
                          <textarea 
                            className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Nima uchun rad etildi? (majburiy emas)"
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setShowRejectInput(null)}
                            >
                              Bekor qilish
                            </Button>
                            <Button 
                              className="flex-1 bg-error hover:bg-error/90 text-white"
                              onClick={() => handleGrade(submission.id, 'rejected', rejectReason)}
                              disabled={gradingId !== null}
                            >
                              {gradingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : 'Tasdiqlash'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 text-error border-error/50 hover:bg-error hover:text-white"
                            onClick={() => setShowRejectInput(submission.id)}
                            disabled={gradingId !== null}
                          >
                            <X size={18} className="mr-2" /> Rad etish
                          </Button>
                          <Button 
                            className="flex-1 bg-success hover:bg-success-hover text-white"
                            onClick={() => handleGrade(submission.id, 'graded')}
                            disabled={gradingId !== null}
                          >
                            {gradingId === submission.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={18} className="mr-2" /> Qabul qilish</>}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {zoomImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm m-0 p-0"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative w-screen h-screen flex items-center justify-center m-0 p-0">
            <button 
              className="absolute top-4 right-4 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[10000] backdrop-blur-md shadow-lg"
              onClick={(e) => { e.stopPropagation(); setZoomImage(null); }}
            >
              <X size={24} />
            </button>
            <Image 
              src={zoomImage} 
              width={800} 
              height={600} 
              alt="To'liq o'lcham" 
              className="w-full h-auto object-contain max-h-[80vh] rounded-lg" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
