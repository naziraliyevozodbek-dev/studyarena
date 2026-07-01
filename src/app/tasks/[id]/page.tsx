'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, UploadCloud, FileImage, FileText, Headphones, CheckCircle, XCircle, Trash2, File as FileIcon, Camera, Image as ImageIcon, Crop as CropIcon, Paperclip } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useHaptic } from '@/hooks/useHaptic';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import { ImageCropper } from '@/components/ImageCropper';

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1280;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); 
            }
          },
          'image/jpeg',
          0.75 
        );
      };
      img.onerror = () => resolve(file); 
    };
    reader.onerror = () => resolve(file); 
  });
};

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const { user, token } = useAuth();
  const router = useRouter();
  const haptic = useHaptic();
  const sound = useSoundSystem();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [cropQueue, setCropQueue] = useState<{file: File, index: number}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
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
      toast.error("Vazifani yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    setIsCompressing(true);
    try {
      const processedFiles = await Promise.all(
        newFiles.map(async f => {
          if (f.type.startsWith('image/')) {
            return await compressImage(f);
          }
          return f; // Keep PDF, audio as is
        })
      );
      setFiles(prev => [...prev, ...processedFiles]);
      haptic.impact('light');
    } catch (err) {
      console.error("File processing failed:", err);
      toast.error("Fayllarni ishlashda xatolik");
    } finally {
      setIsCompressing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const initiateCrop = (index: number) => {
    const file = files[index];
    if (file && file.type.startsWith('image/')) {
      setCropQueue([{ file, index }]);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    const currentCrop = cropQueue[0];
    setIsCompressing(true);
    try {
      const processed = await compressImage(croppedFile);
      setFiles(prev => prev.map((f, i) => i === currentCrop.index ? processed : f));
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompressing(false);
      setCropQueue(prev => prev.slice(1));
    }
  };
  
  const handleCropCancel = () => {
    setCropQueue(prev => prev.slice(1));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      if (newFiles.length > 0) handleFiles(newFiles);
    }
  };

  const removeFile = (index: number) => {
    haptic.impact('light');
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage size={20} className="text-blue-500" />;
    if (type.startsWith('audio/')) return <Headphones size={20} className="text-purple-500" />;
    if (type === 'application/pdf') return <FileText size={20} className="text-red-500" />;
    return <FileIcon size={20} className="text-gray-500" />;
  };

  const handleSubmit = () => {
    if (files.length === 0 && !description.trim()) {
      toast.error("Iltimos, fayl yuklang yoki matn kiriting!");
      haptic.notification('error');
      sound.playError();
      return;
    }

    haptic.impact('medium');
    sound.playClick();
    setSubmitting(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('description', description);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/student/tasks/${resolvedParams.id}/submit`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      setSubmitting(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Vazifa muvaffaqiyatli yuborildi!");
        haptic.notification('success');
        sound.playSuccess();
        fetchTask();
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          toast.error(errorData.error || "Xatolik yuz berdi");
        } catch {
          toast.error("Yuborishda noma'lum xatolik");
        }
        haptic.notification('error');
        sound.playError();
      }
    };
    
    xhr.onerror = () => {
      setSubmitting(false);
      toast.error("Tarmoq xatosi yuz berdi");
      haptic.notification('error');
      sound.playError();
    };
    
    xhr.send(formData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-bg-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
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
          onClick={() => { haptic.impact('light'); router.back(); }} 
          className="text-primary active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Back</span>
          </div>
        </button>
      </div>

      {cropQueue.length > 0 && (
        <ImageCropper 
          imageFile={cropQueue[0].file} 
          onCropComplete={handleCropComplete} 
          onCancel={handleCropCancel} 
        />
      )}

      <div className="flex-1 flex flex-col w-full">
        <div className="mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
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
          <Card padding="lg" className="mt-auto text-center border-dashed border-success animate-slide-up" style={{animationDelay: '0.2s'}}>
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
                    {parsedSubmission.files.map((url: string, idx: number) => {
                      const isPdf = url.includes('.pdf');
                      const isAudio = url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a');
                      
                      if (isPdf) {
                        return (
                          <a href={url} target="_blank" key={idx} className="rounded-lg border border-border bg-bg-secondary aspect-square flex flex-col items-center justify-center p-2 text-center text-red-500">
                            <FileText size={32} className="mb-2" />
                            <span className="text-[10px] font-medium break-all">Hujjat</span>
                          </a>
                        );
                      }
                      if (isAudio) {
                        return (
                          <a href={url} target="_blank" key={idx} className="rounded-lg border border-border bg-bg-secondary aspect-square flex flex-col items-center justify-center p-2 text-center text-purple-500">
                            <Headphones size={32} className="mb-2" />
                            <span className="text-[10px] font-medium break-all">Ovozli xabar</span>
                          </a>
                        );
                      }
                      return (
                        <div key={idx} className="rounded-lg overflow-hidden border border-border bg-bg-secondary aspect-square flex items-center justify-center">
                          <img src={url} alt={`Submission ${idx+1}`} className="w-full h-full object-cover" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <div className="mt-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            {isRejected && (
              <Card padding="md" className="mb-6 bg-error/10 border-error border-dashed text-center">
                <XCircle size={32} className="mx-auto text-error mb-2" />
                <h3 className="font-bold text-error mb-1">Qayta ishlash kerak</h3>
                <p className="text-xs text-error/80">Mentor vazifani qabul qilmadi. Iltimos, xatolarni to'g'rilab qaytadan yuklang.</p>
              </Card>
            )}

            <Card padding="md" className="border-dashed flex flex-col gap-4">
              <h3 className="font-semibold text-text-main text-center">Vazifani yuborish</h3>
              
              <textarea
                placeholder="Qo'shimcha izoh yoki matn (ixtiyoriy)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              />

              <input 
                type="file" 
                accept="image/*"
                multiple
                className="hidden" 
                onChange={handleFileChange}
                ref={fileInputRef}
                id="gallery-upload"
              />
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                className="hidden" 
                onChange={handleFileChange}
                id="camera-upload"
              />
              <input 
                type="file" 
                multiple
                className="hidden" 
                onChange={handleFileChange}
                id="file-upload"
              />

              {files.length > 0 && (
                <div className="flex flex-col gap-2 mb-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="w-full p-3 rounded-xl border border-border bg-bg-secondary flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {getFileIcon(f.type)}
                        <span className="text-xs font-medium text-text-main truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {f.type.startsWith('image/') && (
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); initiateCrop(idx); }}
                            className="text-primary hover:text-primary/80 p-1.5 transition-colors bg-primary/10 rounded-lg flex items-center gap-1 text-[10px] font-bold mr-1"
                          >
                            <CropIcon size={14} /> Kesish
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-text-tertiary hover:text-error p-1.5 transition-colors bg-bg-base rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                 <button type="button" onClick={() => { haptic.impact('light'); document.getElementById('camera-upload')?.click(); }} className="flex items-center justify-center gap-2 py-3 bg-bg-secondary border border-border rounded-xl text-sm font-bold text-text-main hover:bg-border transition-colors">
                   <Camera size={18} /> Kamera
                 </button>
                 <button type="button" onClick={() => { haptic.impact('light'); document.getElementById('gallery-upload')?.click(); }} className="flex items-center justify-center gap-2 py-3 bg-bg-secondary border border-border rounded-xl text-sm font-bold text-text-main hover:bg-border transition-colors">
                   <ImageIcon size={18} /> Galereya
                 </button>
              </div>
              <button type="button" onClick={() => { haptic.impact('light'); document.getElementById('file-upload')?.click(); }} className="flex items-center justify-center gap-2 py-3 bg-bg-secondary border border-border rounded-xl text-sm font-bold text-text-main hover:bg-border transition-colors w-full">
                 <Paperclip size={18} /> Boshqa fayllar
              </button>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer
                  ${isCompressing ? 'border-text-tertiary bg-bg-secondary cursor-not-allowed opacity-70' : 
                    isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                  }`}
              >
                {isCompressing ? (
                  <>
                    <Loader2 size={24} className="text-text-tertiary animate-spin" />
                    <span className="text-xs font-medium text-text-tertiary">Fayl ishlanyapti...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={28} className="text-primary mb-1" />
                    <span className="text-sm font-semibold text-text-main">Fayllarni shu yerga tashlang</span>
                    <span className="text-xs font-medium text-text-tertiary">Maksimal hajm: 20MB</span>
                  </>
                )}
              </div>

              {submitting && (
                <div className="w-full bg-bg-secondary rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={(files.length === 0 && !description.trim()) || submitting} 
                fullWidth 
                className="mt-2"
              >
                {submitting ? `Yuklanmoqda... ${uploadProgress}%` : 'Yuborish'}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
