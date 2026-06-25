'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, X, Check, Volume2, Star, ChevronDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LearnPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  
  const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all');

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

  const playTTS = (text: string) => {
    if (!text) return;
    // Use Google Translate TTS to bypass browser WebSpeechAPI limitations on mobile
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&q=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    audio.play().catch(e => {
      console.error("Audio play failed:", e);
      alert("Ovozni o'ynatish imkoni bo'lmadi. Telefoningiz ovozini tekshiring.");
    });
  };

  const availableLessons = useMemo(() => {
    const lessons = new Set(vocabularies.map(v => v.lesson_number).filter(n => n != null));
    return Array.from(lessons).sort((a, b) => a - b);
  }, [vocabularies]);

  const filteredVocabs = useMemo(() => {
    if (selectedLesson === 'all') return vocabularies;
    return vocabularies.filter(v => v.lesson_number === selectedLesson);
  }, [vocabularies, selectedLesson]);

  // Reset index when lesson changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  }, [selectedLesson]);

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

      // Update original vocabularies to remove the learned one so it doesn't reappear
      if (status === 'learned') {
        setVocabularies(prev => prev.filter(v => v.id !== currentVocab.id));
      }

      // Move to next card
      if (currentIndex < filteredVocabs.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
      } else {
        setSessionCompleted(true);
      }
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

  const currentVocab = filteredVocabs[currentIndex];

  return (
    <div className="animate-fade-in pb-24 min-h-screen flex flex-col bg-[#F9F9FB] dark:bg-bg-main">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 px-4 mb-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-primary font-semibold hover:opacity-80">
          <ArrowLeft size={20} />
          <span>Flashcardlar</span>
        </button>
        
        {availableLessons.length > 0 && (
          <div className="relative">
            <select 
              value={selectedLesson} 
              onChange={(e) => setSelectedLesson(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="appearance-none bg-white dark:bg-bg-secondary border border-border text-primary font-semibold text-sm rounded-xl pl-4 pr-10 py-2 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              <option value="all">Barchasi</option>
              {availableLessons.map(l => (
                <option key={l} value={l}>{l}-dars</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4">
        {filteredVocabs.length === 0 ? (
          <Card padding="lg" className="text-center mt-10 border-dashed">
            <h2 className="text-xl font-bold text-text-main mb-2">So'zlar yo'q!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Bu bo'limda yodlash uchun yangi so'zlar topilmadi.
            </p>
            <Button onClick={() => router.push('/')}>Orqaga qaytish</Button>
          </Card>
        ) : sessionCompleted ? (
          <Card padding="lg" className="text-center mt-10 border-success">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Ajoyib!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Siz ushbu darsdagi barcha so'zlarni ko'rib chiqdingiz!
            </p>
            <Button onClick={() => router.push('/')} fullWidth>Bosh sahifa</Button>
          </Card>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center gap-4 text-sm font-bold text-text-secondary mb-2">
                <span className="bg-white dark:bg-bg-secondary px-3 py-1 rounded-full shadow-sm">
                  {currentIndex + 1} / {filteredVocabs.length}
                </span>
                <div className="flex-1 bg-bg-secondary rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / filteredVocabs.length) * 100}%` }}
                  />
                </div>
                <span>{Math.round(((currentIndex + 1) / filteredVocabs.length) * 100)}%</span>
              </div>
            </div>

            {/* Flashcard Area */}
            <div className="flex-1 flex flex-col justify-center min-h-[420px] mb-8 [perspective:1000px]">
              <div className={`relative w-full h-[450px] transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                
                {/* Front (German) */}
                <Card className="absolute w-full h-full [backface-visibility:hidden] flex flex-col p-6 border border-border shadow-lg bg-white dark:bg-bg-card rounded-3xl cursor-pointer" onClick={() => !isFlipped && setIsFlipped(true)}>
                  <div className="flex justify-end mb-4">
                    <Star size={24} className="text-text-tertiary" />
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                      Nemischa
                    </span>
                    <h2 className="text-4xl font-bold text-[#1a1a2e] dark:text-white mb-8 break-words w-full">
                      {currentVocab?.german_word}
                    </h2>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                      className="flex items-center gap-2 px-6 py-3 bg-[#F0F0F5] dark:bg-bg-secondary text-[#1a1a2e] dark:text-white rounded-full hover:bg-border active:scale-95 transition-all font-semibold text-sm"
                    >
                      <Volume2 size={20} className="text-primary" /> So'zni eshitish
                    </button>
                  </div>
                  
                  {currentVocab?.example_german && (
                    <div className="mt-auto mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] text-primary font-bold">T</span>
                        </div>
                        <span className="text-xs font-bold text-text-tertiary">Misol gap</span>
                      </div>
                      <p className="text-lg font-bold text-[#1a1a2e] dark:text-white leading-snug">
                        {currentVocab?.example_german}
                      </p>
                    </div>
                  )}

                  <div className="w-full flex justify-center pb-2">
                    <button className="flex items-center gap-2 text-sm font-semibold text-text-tertiary hover:text-primary transition-colors">
                      <X size={16} /> Tarjimani ko'rish <ChevronDown size={16} />
                    </button>
                  </div>
                </Card>

                {/* Back (Translation) */}
                <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col p-6 border border-border shadow-lg bg-white dark:bg-bg-card rounded-3xl">
                  <div className="flex justify-end mb-2">
                    <Star size={24} className="text-warning fill-warning" />
                  </div>
                  
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                      Nemischa
                    </span>
                    <h2 className="text-3xl font-bold text-[#1a1a2e] dark:text-white break-words">
                      {currentVocab?.german_word}
                    </h2>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-[#EAF6ED] dark:bg-success/10 rounded-2xl p-4 border border-[#C3E6CB] dark:border-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🇺🇿</span>
                        <span className="text-xs font-bold text-[#2E7D32] dark:text-success">Tarjima</span>
                      </div>
                      <p className="text-xl font-bold text-[#1a1a2e] dark:text-white ml-8">
                        {currentVocab?.translation}
                      </p>
                    </div>

                    {currentVocab?.example_uzbek && (
                      <div className="bg-[#F4F0FF] dark:bg-primary/10 rounded-2xl p-4 border border-[#E0D4FF] dark:border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={16} className="text-[#6200EE] dark:text-primary" />
                          <span className="text-xs font-bold text-[#6200EE] dark:text-primary">Misol gapning tarjimasi</span>
                        </div>
                        <p className="text-sm font-semibold text-[#1a1a2e] dark:text-white ml-6">
                          {currentVocab?.example_uzbek}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                      className="flex items-center gap-2 px-6 py-2 bg-transparent text-text-secondary hover:text-primary transition-colors text-sm font-semibold"
                    >
                      <Volume2 size={18} /> So'zni eshitish
                    </button>
                  </div>

                  <div className="mt-auto w-full flex gap-3">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FFF0F0] dark:bg-error/10 text-error rounded-2xl font-bold hover:bg-[#FFE5E5] dark:hover:bg-error/20 transition-colors"
                      onClick={() => handleProgress('weak')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={20} className="animate-spin" /> : <><X size={20} /> Bilmayman</>}
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#EAF6ED] dark:bg-success/20 text-success rounded-2xl font-bold hover:bg-[#D4EED8] dark:hover:bg-success/30 transition-colors"
                      onClick={() => handleProgress('learned')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={20} className="animate-spin" /> : <><Check size={20} /> Bilaman</>}
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-between items-center px-4 font-bold text-primary text-sm">
              <span className={isFlipped ? "text-text-tertiary" : ""}>Old tomoni<br/><span className="text-xs font-medium">(Tarjima yopiq)</span></span>
              <span className={!isFlipped ? "text-text-tertiary" : ""}>Orqa tomoni<br/><span className="text-xs font-medium">(Tarjima ochiq)</span></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
