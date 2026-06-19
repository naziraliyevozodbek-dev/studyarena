'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, RefreshCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LearnPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  const nextCard = () => {
    if (currentIndex < vocabularies.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
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

  return (
    <div className="animate-fade-in pb-24 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <h1 className="text-2xl font-bold text-text-main">Flashcards</h1>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {vocabularies.length === 0 ? (
          <Card padding="lg" className="text-center mt-10 border-dashed">
            <h2 className="text-xl font-bold text-text-main mb-2">No Vocabulary Yet!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Join a course or wait for your mentor to add new words.
            </p>
            <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
          </Card>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm font-medium text-text-secondary mb-2">
                <span>Card {currentIndex + 1} of {vocabularies.length}</span>
                <span>{Math.round(((currentIndex + 1) / vocabularies.length) * 100)}%</span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard Area */}
            <div className="flex-1 flex flex-col justify-center min-h-[300px] mb-8 perspective-1000">
              <div 
                className={`relative w-full h-64 sm:h-80 transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front (German) */}
                <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center border-2 border-border shadow-md">
                  <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 px-3 py-1 bg-bg-secondary rounded-full">
                    {vocabularies[currentIndex]?.courses?.title || 'Vocabulary'}
                  </span>
                  <h2 className="text-4xl font-black text-text-main mb-4 break-words w-full">
                    {vocabularies[currentIndex]?.german_word}
                  </h2>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mt-auto bg-primary/10 px-4 py-2 rounded-full">
                    <RefreshCw size={16} />
                    <span>Tap to flip</span>
                  </div>
                </Card>

                {/* Back (Translation) */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center border-2 border-primary shadow-md bg-primary/5">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-3 py-1 bg-primary/10 rounded-full">
                    Translation
                  </span>
                  <h2 className="text-3xl font-bold text-text-main mb-4 break-words w-full">
                    {vocabularies[currentIndex]?.translation}
                  </h2>
                  <div className="flex items-center gap-2 text-text-secondary text-sm font-medium mt-auto bg-bg-secondary px-4 py-2 rounded-full">
                    <RefreshCw size={16} />
                    <span>Tap to flip back</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mt-auto mb-4">
              <Button 
                variant="outline" 
                onClick={prevCard} 
                disabled={currentIndex === 0}
                className="flex-1 py-6 bg-bg-card border-2"
              >
                <ChevronLeft size={24} />
              </Button>
              <Button 
                onClick={nextCard}
                className={`flex-1 py-6 text-white border-2 border-transparent ${currentIndex === vocabularies.length - 1 ? 'bg-success hover:bg-success-hover' : 'bg-primary hover:bg-primary-hover'}`}
              >
                {currentIndex === vocabularies.length - 1 ? (
                  <div className="flex items-center justify-center gap-2 text-lg font-bold">
                    <Check size={24} /> Finish
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-lg font-bold">
                    Next <ChevronRight size={24} />
                  </div>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
