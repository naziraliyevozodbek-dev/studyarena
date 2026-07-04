'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, X, Check, Volume2, Star, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import confetti from 'canvas-confetti';

export default function LearnPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Flashcard State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const { playSuccess, playError } = useSoundSystem();
  
  // UX Mode State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (vocabularies.length > 0) {
      const initialSaved: Record<string, boolean> = {};
      vocabularies.forEach(v => {
        if (v.is_starred) initialSaved[v.id] = true;
      });
      setSavedWords(prev => ({ ...prev, ...initialSaved }));
    }
  }, [vocabularies]);

  const toggleSave = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const currentStatus = !!savedWords[id];
    setSavedWords(prev => ({ ...prev, [id]: !currentStatus }));

    try {
      await fetch('/api/student/learn/star', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vocabulary_id: id, is_starred: !currentStatus })
      });
    } catch (err) {
      console.error(err);
      setSavedWords(prev => ({ ...prev, [id]: currentStatus }));
      toast.error("Saqlashda xatolik yuz berdi");
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'mentor') {
      router.push('/mentor');
      return;
    }
    fetchVocabularies();
  }, [user, router]);

  const fetchVocabularies = async () => {
    try {
      if (!token) return;
      setLoading(true);
      const res = await fetch('/api/student/learn', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setVocabularies(data.vocabularies || []);
    } catch (error) {
      console.error('Error fetching vocabularies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fallbackTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playTTS = (text: string) => {
    if (!text) return;
    try {
      const player = document.getElementById('tts-player') as HTMLAudioElement;
      if (player) {
        player.src = `/api/tts?text=${encodeURIComponent(text)}`;
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("Audio playback failed", err);
            toast.error("Ovozni eshitish uchun telefoningiz 'Silent' rejimda emasligiga ishonch hosil qiling.");
            fallbackTTS(text);
          });
        }
      } else {
        fallbackTTS(text);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      fallbackTTS(text);
    }
  };

  // CATEGORY DATA LOGIC
  const categoriesData = useMemo(() => {
    const cats: Record<string, { total: number; learned: number }> = {};
    vocabularies.forEach(v => {
      const c = v.category || "Asosiy so'zlar";
      if (!cats[c]) cats[c] = { total: 0, learned: 0 };
      cats[c].total++;
      if (v.progress_status === 'learned') cats[c].learned++;
    });
    return Object.entries(cats).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => a.name.localeCompare(b.name));
  }, [vocabularies]);

  // FLASHCARDS LOGIC FOR SELECTED CATEGORY
  const filteredVocabs = useMemo(() => {
    if (!selectedCategory) return [];
    return vocabularies.filter(v => (v.category || "Asosiy so'zlar") === selectedCategory && v.progress_status !== 'learned');
  }, [vocabularies, selectedCategory]);

  const enterCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const exitCategory = () => {
    setSelectedCategory(null);
  };

  const handleProgress = async (status: 'learned' | 'weak') => {
    if (!token || filteredVocabs.length === 0) return;
    setSavingProgress(true);

    const currentVocab = filteredVocabs[currentIndex];
    
    try {
      await fetch('/api/student/learn/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vocabulary_id: currentVocab.id,
          status: status
        })
      });

      if (status === 'learned') {
        setVocabularies(prev => prev.map(v => v.id === currentVocab.id ? { ...v, progress_status: 'learned' } : v));
      }

      if (currentIndex < filteredVocabs.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
      } else {
        setSessionCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      if (status === 'learned') playSuccess();
      else playError();
      
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="flex items-center pt-4 mb-6">
          <button onClick={() => router.push('/')} className="mr-4 text-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-main">Vocabulary Categories</h1>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoriesData.length === 0 ? (
            <Card padding="lg" className="text-center border-dashed col-span-1 md:col-span-2">
              <BookOpen size={32} className="mx-auto text-text-tertiary mb-4" />
              <h2 className="text-lg font-semibold text-text-main mb-1">No Vocabularies</h2>
              <p className="text-sm text-text-secondary">Your mentors haven't uploaded any vocabularies yet.</p>
            </Card>
          ) : (
            categoriesData.map(cat => {
              const progressPercentage = Math.round((cat.learned / cat.total) * 100);
              const isCompleted = cat.learned === cat.total;
              
              return (
                <div 
                  key={cat.name} 
                  onClick={() => enterCategory(cat.name)}
                  className="relative group bg-bg-card rounded-[20px] p-5 border border-border/40 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-main text-lg leading-tight">{cat.name}</h3>
                        <p className="text-xs text-text-secondary font-medium">{cat.total} ta so'z</p>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-text-secondary">Progress</span>
                      <span className={isCompleted ? "text-success" : "text-primary"}>
                        {cat.learned} / {cat.total} ({progressPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const currentVocab = filteredVocabs[currentIndex];

  return (
    <div className="fixed inset-0 z-[60] bg-bg-base flex flex-col animate-in slide-in-from-bottom-5" style={{ height: '100dvh' }}>
      <audio id="tts-player" playsInline className="hidden" />
      
      <div className="flex items-center justify-between px-4 pt-safe pb-3 shrink-0">
        <button onClick={exitCategory} className="w-10 h-10 rounded-full bg-bg-secondary/50 text-text-main flex items-center justify-center hover:bg-bg-secondary transition-colors">
          <X size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-text-main text-lg truncate max-w-[200px]">{selectedCategory}</h2>
          {!sessionCompleted && filteredVocabs.length > 0 && (
            <p className="text-xs font-bold text-text-secondary bg-bg-secondary/50 px-2 py-0.5 rounded-full inline-block mt-1 border border-border">
              {currentIndex + 1} / {filteredVocabs.length}
            </p>
          )}
        </div>
        <div className="w-10 h-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 [perspective:1000px] px-4 pb-4">
        {filteredVocabs.length === 0 ? (
          <Card padding="lg" className="text-center w-full max-w-sm border-dashed">
            <h2 className="text-xl font-bold text-text-main mb-2">Barchasi o'rganilgan!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Siz bu kategoriyadagi barcha so'zlarni yodlabsiz.
            </p>
            <Button onClick={exitCategory} fullWidth>Orqaga qaytish</Button>
          </Card>
        ) : sessionCompleted ? (
          <Card padding="lg" className="text-center w-full max-w-sm border-success shadow-lg shadow-success/10 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping opacity-75"></div>
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Ajoyib!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Siz ushbu bo'limdagi barcha so'zlarni ko'rib chiqdingiz!
            </p>
            <Button onClick={exitCategory} fullWidth className="h-14 text-lg">Davom etish</Button>
          </Card>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center gap-4" style={{ maxHeight: 'calc(100dvh - 140px)' }}>
            <div className={`grid w-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ height: 'min(500px, calc(100dvh - 220px))' }}>
            
            {/* Front Card */}
            <div 
              className="col-start-1 row-start-1 w-full h-full [backface-visibility:hidden] flex flex-col p-6 border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white dark:bg-bg-card rounded-[32px] transition-shadow"
            >
              <div className="flex justify-end mb-4 shrink-0">
                <button 
                  onClick={(e) => toggleSave(e, currentVocab?.id)} 
                  className="p-3 bg-bg-secondary/30 rounded-full hover:bg-bg-secondary transition-colors"
                >
                  <Star size={24} className={savedWords[currentVocab?.id] ? "text-yellow-400 fill-yellow-400" : "text-text-tertiary"} />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-6">🇩🇪</span>
                <h2 className="text-4xl sm:text-5xl font-black text-text-main mb-10 break-words w-full px-4">
                  {currentVocab?.german_word}
                </h2>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                  className="flex items-center gap-3 active:scale-95 transition-all font-bold text-base text-primary bg-primary/10 hover:bg-primary/20 px-6 py-3.5 rounded-[16px]"
                >
                  <Volume2 size={20} />
                  Ovozli eshitish
                </button>
              </div>
              
              {currentVocab?.example_german && (
                <div className="w-full bg-bg-secondary/50 p-5 rounded-2xl border border-border/40 mt-6 shrink-0">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">📝 Misol gap</span>
                  <p className="text-lg font-semibold text-text-main leading-snug">
                    {currentVocab?.example_german}
                  </p>
                </div>
              )}
            </div>

            {/* Back Card */}
            <div className="col-start-1 row-start-1 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col p-6 border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white dark:bg-bg-card rounded-[32px]">
              <div className="flex justify-end mb-4 shrink-0">
                <button 
                  onClick={(e) => toggleSave(e, currentVocab?.id)} 
                  className="p-3 bg-bg-secondary/30 rounded-full hover:bg-bg-secondary transition-colors"
                >
                  <Star size={24} className={savedWords[currentVocab?.id] ? "text-yellow-400 fill-yellow-400" : "text-text-tertiary"} />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-6">🇺🇿</span>
                <h2 className="text-4xl sm:text-5xl font-black text-text-main break-words w-full px-4">
                  {currentVocab?.translation}
                </h2>

                {currentVocab?.example_uzbek && (
                  <div className="w-full bg-primary/5 p-5 rounded-2xl border border-primary/10 mt-8 shrink-0">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">📝 Misol tarjimasi</span>
                    <p className="text-base font-semibold text-text-main leading-snug">
                      {currentVocab?.example_uzbek}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-6 shrink-0 mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                  className="flex items-center gap-3 active:scale-95 transition-all font-bold text-base text-primary bg-primary/10 hover:bg-primary/20 px-6 py-3.5 rounded-[16px]"
                >
                  <Volume2 size={20} />
                  Qayta eshitish
                </button>
              </div>
              
              <div className="w-full flex gap-3 mt-auto shrink-0">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-error/10 text-error rounded-[20px] font-bold hover:bg-error/20 transition-colors text-lg shadow-sm"
                  onClick={() => handleProgress('weak')}
                  disabled={savingProgress}
                >
                  {savingProgress ? <Loader2 size={24} className="animate-spin" /> : <>Bilmayman</>}
                </button>
                <button 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-success/10 text-success rounded-[20px] font-bold hover:bg-success/20 transition-colors text-lg shadow-sm"
                  onClick={() => handleProgress('learned')}
                  disabled={savingProgress}
                >
                  {savingProgress ? <Loader2 size={24} className="animate-spin" /> : <>Bilaman</>}
                </button>
              </div>
            </div>
            </div>

            {/* Flip Button */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-bg-secondary/80 text-text-main rounded-2xl font-bold text-base hover:bg-bg-secondary active:scale-95 transition-all border border-border/50 shadow-sm mx-auto"
            >
              <RefreshCw size={18} />
              {isFlipped ? 'Oldi tomonga' : 'Orqa tomonga'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
