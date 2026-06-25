'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, X, Check, Volume2, Star, ChevronDown, MessageSquare, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  
  const [selectedLesson, setSelectedLesson] = useState<number | 'all'>('all');

  useEffect(() => {
    const saved = localStorage.getItem('studyarena_saved_words');
    if (saved) {
      try {
        setSavedWords(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedWords(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('studyarena_saved_words', JSON.stringify(next));
      return next;
    });
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

  const playTTS = (text: string) => {
    if (!text) return;
    try {
      // Primary: Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Fallback
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audio.play().catch(err => {
        console.error("Audio play failed:", err);
      });
    }
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

  const handleNext = () => {
    if (currentIndex < filteredVocabs.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
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
    <div className="animate-fade-in pb-20 pt-2 flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden">
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
                  <div className="flex justify-end mb-2">
                    <button onClick={(e) => toggleSave(e, currentVocab?.id)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <Star size={28} className={savedWords[currentVocab?.id] ? "text-warning fill-warning" : "text-text-tertiary dark:text-white/50"} />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                      Nemischa
                    </span>
                    <h2 className="text-4xl font-bold text-text-main mb-6 break-words w-full">
                      {currentVocab?.german_word}
                    </h2>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                      className="flex items-center gap-4 active:scale-95 transition-all font-semibold text-[15px] text-text-main"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Volume2 size={24} className="text-primary" />
                      </div>
                      So'zni eshitish
                    </button>
                  </div>
                  
                  {currentVocab?.example_german && (
                    <div className="w-full text-left mt-6">
                      <div className="w-full h-px bg-border mb-6"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] text-primary font-bold">T</span>
                        </div>
                        <span className="text-xs font-bold text-text-tertiary">Misol gap</span>
                      </div>
                      <p className="text-lg font-bold text-text-main leading-snug">
                        {currentVocab?.example_german}
                      </p>
                    </div>
                  )}

                  <div className="w-full flex justify-center mt-auto pt-4">
                    <button className="w-full flex items-center justify-center gap-3 py-4 border border-border rounded-2xl text-primary font-bold hover:bg-primary/5 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      Tarjimani ko'rish <ChevronDown size={20} />
                    </button>
                  </div>
                </Card>

                {/* Back (Translation) */}
                <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col p-6 border border-border shadow-lg bg-white dark:bg-bg-card rounded-3xl">
                  <div className="flex justify-end mb-2">
                    <button onClick={(e) => toggleSave(e, currentVocab?.id)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <Star size={28} className={savedWords[currentVocab?.id] ? "text-warning fill-warning" : "text-text-tertiary dark:text-white/50"} />
                    </button>
                  </div>
                  
                  <div className="text-center mb-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                      Nemischa
                    </span>
                    <h2 className="text-3xl font-bold text-text-main break-words">
                      {currentVocab?.german_word}
                    </h2>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-4 mt-4">
                    <div className="bg-[#EAF6ED] dark:bg-[#1C2C22] rounded-2xl p-4 border border-[#C3E6CB] dark:border-[#234A2E]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🇺🇿</span>
                        <span className="text-xs font-bold text-[#2E7D32] dark:text-success">Tarjima</span>
                      </div>
                      <p className="text-xl font-bold text-text-main ml-8">
                        {currentVocab?.translation}
                      </p>
                    </div>

                    {currentVocab?.example_uzbek && (
                      <div className="bg-[#F4F0FF] dark:bg-[#2A243D] rounded-2xl p-4 border border-[#E0D4FF] dark:border-[#3E345C]">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={16} className="text-[#6200EE] dark:text-[#B388FF]" />
                          <span className="text-xs font-bold text-[#6200EE] dark:text-[#B388FF]">Misol gapning tarjimasi</span>
                        </div>
                        <p className="text-sm font-semibold text-text-main ml-6">
                          {currentVocab?.example_uzbek}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center mb-6 mt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                      className="flex items-center gap-4 active:scale-95 transition-all font-semibold text-[15px] text-text-main"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Volume2 size={24} className="text-primary" />
                      </div>
                      So'zni eshitish
                    </button>
                  </div>

                  <div className="mt-auto w-full flex gap-3">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FFF0F0] dark:bg-[#FFEAED]/10 text-error rounded-2xl font-bold hover:bg-[#FFE5E5] dark:hover:bg-[#FFEAED]/20 transition-colors"
                      onClick={() => handleProgress('weak')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={20} className="animate-spin" /> : <><X size={20} /> Bilmayman</>}
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#EAF6ED] dark:bg-[#E8F8ED]/10 text-success rounded-2xl font-bold hover:bg-[#D4EED8] dark:hover:bg-[#E8F8ED]/20 transition-colors"
                      onClick={() => handleProgress('learned')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={20} className="animate-spin" /> : <><Check size={20} /> Bilaman</>}
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 pb-2 px-4">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 bg-white dark:bg-bg-card border border-border rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-sm text-text-main active:scale-95 transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              
              <span className="font-bold text-text-main text-lg">{currentIndex + 1} / {filteredVocabs.length}</span>
              
              <button 
                onClick={handleNext}
                disabled={currentIndex === filteredVocabs.length - 1}
                className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                <ArrowRight size={24} /> 
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
