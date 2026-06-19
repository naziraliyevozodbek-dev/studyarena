'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, UploadCloud, FileImage, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TaskDetail({ params }: { params: { id: string } }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'mentor') {
      router.push('/mentor');
      return;
    }
    fetchTask();
  }, [user, router, params.id]);

  const fetchTask = async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/student/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const currentTask = data.tasks?.find((t: any) => t.id === params.id);
      setTask(currentTask);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Iltimos, rasm yuklang!");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', 'Image submission');

      const res = await fetch(`/api/student/tasks/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit');
      }
      
      alert('Vazifa yuborildi!');
      fetchTask();
    } catch (error: any) {
      console.error('Submission error:', error);
      alert('Xatolik: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <h1 className="text-xl font-bold mb-2">Vazifa topilmadi</h1>
        <Button onClick={() => router.back()}>Orqaga qaytish</Button>
      </div>
    );
  }

  const isSubmitted = task.submission && task.submission.status !== 'rejected';
  const isRejected = task.submission?.status === 'rejected';
  const isGraded = task.submission?.status === 'graded';

  return (
    <div className="animate-fade-in pb-24 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-primary active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Back</span>
          </div>
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-text-main leading-tight">{task.title}</h1>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
              +{task.xp_reward} XP
            </span>
          </div>
          <p className="text-sm font-medium text-text-secondary mb-4">{task.courses?.title}</p>
          
          {task.description && (
            <Card padding="md" className="mb-6 bg-bg-secondary border-none">
              <p className="text-text-main text-sm whitespace-pre-wrap">{task.description}</p>
            </Card>
          )}
          
          {task.deadline && (
            <p className="text-xs text-text-tertiary mb-6">
              Muddat: <span className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
            </p>
          )}
        </div>

        {/* Status Area */}
        {isSubmitted ? (
          <Card padding="lg" className="mt-auto text-center border-dashed border-success">
            {isGraded ? (
              <CheckCircle size={48} className="mx-auto text-success mb-4" />
            ) : (
              <Loader2 size={48} className="mx-auto text-warning mb-4" />
            )}
            <h2 className="text-xl font-bold text-text-main mb-2">
              {isGraded ? 'Ajoyib! Qabul qilindi' : 'Tekshirilmoqda'}
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              {isGraded 
                ? `Mentor vazifangizni tasdiqladi va siz +${task.submission.score || task.xp_reward} XP oldingiz!` 
                : 'Sizning vazifangiz mentorga yuborildi. Tekshirilishini kuting.'}
            </p>
            
            {task.submission.content && task.submission.content.startsWith('http') && (
              <div className="mt-4 rounded-lg overflow-hidden border border-border">
                <img src={task.submission.content} alt="Your submission" className="w-full object-cover max-h-48" />
              </div>
            )}
          </Card>
        ) : (
          <div className="mt-auto">
            {isRejected && (
              <Card padding="md" className="mb-6 bg-error/10 border-error border-dashed text-center">
                <XCircle size={32} className="mx-auto text-error mb-2" />
                <h3 className="font-bold text-error mb-1">Qayta ishlash kerak</h3>
                <p className="text-xs text-error/80">Mentor vazifani qabul qilmadi. Iltimos, xatolarni to'g'rilab qaytadan rasmga oling va yuklang.</p>
              </Card>
            )}

            <Card padding="md" className="border-dashed">
              <h3 className="font-semibold text-text-main mb-4 text-center">Vazifani yuborish</h3>
              
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {!file ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-3 active:bg-primary/10 transition-colors"
                >
                  <UploadCloud size={32} className="text-primary" />
                  <span className="text-sm font-medium text-primary">Rasm yuklash yoki kameraga olish</span>
                </button>
              ) : (
                <div className="w-full p-4 rounded-xl border border-border bg-bg-secondary flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileImage size={24} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-text-main truncate">{file.name}</span>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-error p-2"
                  >
                    O'chirish
                  </button>
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={!file || submitting} 
                fullWidth 
                className="mt-4"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> Yuborilmoqda...
                  </div>
                ) : (
                  'Yuborish'
                )}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
