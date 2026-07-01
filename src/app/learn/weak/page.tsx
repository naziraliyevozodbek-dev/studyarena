'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, X, Check, Volume2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';

export default function WeakWordsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

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
      const res = await fetch('/api/student/learn/weak', {
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
            toast.error("Ovozni eshitish uchun telefoningiz 'Silent' (ovozsiz) rejimda emasligiga ishonch hosil qiling.");
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

  const handleProgress = async (status: 'learned' | 'weak') => {
    if (!token || vocabularies.length === 0) return;
    setSavingProgress(true);

    const currentVocab = vocabularies[currentIndex];
    
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

      if (currentIndex < vocabularies.length - 1) {
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

  const currentVocab = vocabularies[currentIndex];

  return (
    <div className="animate-fade-in flex-1 flex flex-col w-full">
      <audio id="tts-player" playsInline className="hidden" />
      <div className="flex items-center justify-between pt-4 mb-4">
        <button onClick={() => router.push('/')} className="text-primary active:opacity-70 transition-opacity">
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Dashboard</span>
          </div>
        </button>
        <h1 className="text-xl font-bold text-error flex items-center gap-2"><AlertTriangle size={20} /> Weak Words</h1>
        <div className="w-20"></div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        {vocabularies.length === 0 ? (
          <Card padding="lg" className="text-center mt-10 border-dashed border-success">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">No Weak Words!</h2>
            <p className="text-text-secondary text-sm mb-6">
              You&apos;re doing great! Keep learning new words.
            </p>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
          </Card>
        ) : sessionCompleted ? (
          <Card padding="lg" className="text-center mt-10 border-success">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Session Completed!</h2>
            <p className="text-text-secondary text-sm mb-6">
              You've practiced your weak words. Great job!
            </p>
            <Button onClick={() => router.push('/')} fullWidth>Return Home</Button>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex-shrink-0">
              <div className="flex justify-between text-sm font-medium text-error mb-2">
                <span>Card {currentIndex + 1} of {vocabularies.length}</span>
                <span>{Math.round(((currentIndex + 1) / vocabularies.length) * 100)}%</span>
              </div>
              <div className="w-full bg-error/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-error h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[400px] [perspective:1000px] mb-4">
              <div className={`relative w-full h-full min-h-[400px] transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <Card className="absolute w-full h-full min-h-[400px] [backface-visibility:hidden] flex flex-col p-6 border-2 border-error shadow-md bg-error/5 rounded-3xl">
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); playTTS(currentVocab?.german_word); }}
                      className="p-3 bg-error/10 text-error rounded-full hover:bg-error/20 active:bg-error/30 transition-colors"
                    >
                      <Volume2 size={24} />
                    </button>
                  </div>
                  
                  <span className="text-xs font-bold text-error uppercase tracking-widest mb-4 px-3 py-1 bg-error/10 rounded-full w-fit">
                    🇩🇪 German
                  </span>
                  
                  <h2 className="text-4xl font-black text-text-main mb-6 break-words w-full">
                    {currentVocab?.german_word}
                  </h2>
                  
                  {currentVocab?.example_german && (
                    <div className="w-full bg-white p-4 rounded-xl mt-2 text-left border-l-4 border-error">
                      <span className="text-xs text-error font-bold mb-1 block">📝 Example:</span>
                      <p className="text-sm font-medium text-text-main leading-relaxed">
                        {currentVocab?.example_german}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto w-full">
                    <Button variant="outline" fullWidth onClick={() => setIsFlipped(true)}>
                      Show translation
                    </Button>
                  </div>
                </Card>

                <Card className="absolute w-full h-full min-h-[400px] [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col p-6 border-2 border-primary shadow-md bg-primary/5 rounded-3xl">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-3 py-1 bg-primary/10 rounded-full w-fit">
                    🇺🇿 Uzbek
                  </span>
                  
                  <h2 className="text-3xl font-bold text-text-main mb-6 break-words w-full">
                    {currentVocab?.translation}
                  </h2>
                  
                  {currentVocab?.example_uzbek && (
                    <div className="w-full bg-white p-4 rounded-xl mt-2 text-left border-l-4 border-success">
                      <span className="text-xs text-text-tertiary font-bold mb-1 block">📝 Misol:</span>
                      <p className="text-sm font-medium text-text-main leading-relaxed">
                        {currentVocab?.example_uzbek}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto w-full flex gap-3">
                    <Button 
                      className="flex-1 py-6 bg-error/10 text-error hover:bg-error/20 border border-error/20" 
                      onClick={() => handleProgress('weak')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={24} className="animate-spin" /> : <><X size={24} className="mr-2" /> Still don&apos;t know</>}
                    </Button>
                    <Button 
                      className="flex-1 py-6 bg-success text-white hover:bg-success-hover" 
                      onClick={() => handleProgress('learned')}
                      disabled={savingProgress}
                    >
                      {savingProgress ? <Loader2 size={24} className="animate-spin" /> : <><Check size={24} className="mr-2" /> I know it now</>}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
