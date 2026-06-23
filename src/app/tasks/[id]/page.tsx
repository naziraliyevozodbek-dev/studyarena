'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, UploadCloud, FileImage, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const { user, token } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'mentor') {
      router.push('/mentor');
      return;
    }
    fetchTask();
  }, [user, router, resolvedParams.id]);

  const fetchTask = async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/student/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const currentTask = data.tasks?.find((t: any) => t.id === resolvedParams.id);
      setTask(currentTask);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !description.trim()) {
      alert("Iltimos, rasm yuklang yoki matn kiriting!");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('description', description);

      const res = await fetch(`/api/student/tasks/${resolvedParams.id}/submit`, {
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

  let parsedSubmission: any = null;
  if (task.submission?.content) {
    try {
      parsedSubmission = JSON.parse(task.submission.content);
    } catch {
      parsedSubmission = { 
        files: task.submission.content.startsWith('http') ? [task.submission.content] : [], 
        description: task.submission.content.startsWith('http') ? '' : task.submission.content 
      };
    }
  }

  return (
    <div className="animate-fade-in pb-24 min-h-screen flex flex-col">
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

      <div className="flex-1 flex flex-col px-4">
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
            
            {parsedSubmission && (
              <div className="mt-4 text-left">
                {parsedSubmission.description && (
                  <p className="text-sm bg-bg-secondary p-3 rounded-xl whitespace-pre-wrap mb-4 border border-border">
                    {parsedSubmission.description}
                  </p>
                )}
                {parsedSubmission.files && parsedSubmission.files.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {parsedSubmission.files.map((url: string, idx: number) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-border bg-bg-secondary aspect-square flex items-center justify-center">
                        <img src={url} alt={`Submission ${idx+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
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

            <Card padding="md" className="border-dashed flex flex-col gap-4">
              <h3 className="font-semibold text-text-main text-center">Vazifani yuborish</h3>
              
              <textarea
                placeholder="Qo'shimcha izoh yoki matn (ixtiyoriy)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-sm min-h-[80px]"
              />

              <input 
                type="file" 
                accept="image/*"
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="w-full p-3 rounded-xl border border-border bg-bg-secondary flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileImage size={20} className="text-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-text-main truncate">{f.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="text-xs font-semibold text-error p-1"
                      >
                        O'chirish
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2 active:bg-primary/10 transition-colors"
              >
                <UploadCloud size={24} className="text-primary" />
                <span className="text-xs font-medium text-primary">Rasm qo'shish</span>
              </button>

              <Button 
                onClick={handleSubmit} 
                disabled={(files.length === 0 && !description.trim()) || submitting} 
                fullWidth 
                className="mt-2"
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
