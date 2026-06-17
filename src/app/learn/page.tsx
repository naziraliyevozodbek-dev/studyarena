'use client';

import { useState, useEffect } from 'react';
import { BookOpen, FileText, Video, Play, ChevronRight, RotateCw, Loader2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';

type Vocab = { id: string; lesson_number: number; german_word: string; translation: string };

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'vocab' | 'resources'>('vocab');
  const [flipped, setFlipped] = useState(false);
  
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = useSupabase();
  const { user } = useAuth();

  useEffect(() => {
    fetchVocabs();

    // Subscribe to realtime changes on vocabularies table
    const channel = supabase.channel('public:vocabularies')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vocabularies' },
        (payload) => {
          // Add the new vocab to the list
          const newVocab = payload.new as Vocab;
          setVocabs((prev) => [...prev, newVocab]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'vocabularies' },
        (payload) => {
          setVocabs((prev) => prev.filter(v => v.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchVocabs = async () => {
    setLoading(true);
    // Fetch all vocabularies for courses the student is enrolled in
    // RLS handles the filtering automatically!
    const { data } = await supabase
      .from('vocabularies')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setVocabs(data);
    setLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < vocabs.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150); // slight delay for flip
    }
  };

  const currentVocab = vocabs[currentIndex];

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-4 text-center">Learn</h1>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-6">
        <button 
          className={`flex-1 py-2 rounded-full font-bold text-sm ${activeTab === 'vocab' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('vocab')}
        >
          Vocabulary
        </button>
        <button 
          className={`flex-1 py-2 rounded-full font-bold text-sm ${activeTab === 'resources' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
      </div>

      {activeTab === 'vocab' && (
        <>
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
          ) : vocabs.length === 0 ? (
             <div className="text-center py-12 text-gray-400 font-bold">No vocabulary available. Wait for your mentor to add some!</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2 m-0">Daily Review</h2>
                <span className="text-sm font-bold text-gray-400">{currentIndex + 1} / {vocabs.length}</span>
              </div>

              {/* Flashcard */}
              <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
                <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
                  <div className="flashcard-front">
                    <span className="text-gray-400 mb-4 font-bold uppercase tracking-widest text-xs">Tap to flip</span>
                    <h3 className="text-3xl font-black text-gray-900">{currentVocab?.german_word}</h3>
                    <div className="mt-auto opacity-50"><RotateCw size={24} /></div>
                  </div>
                  <div className="flashcard-back">
                    <span className="text-blue-200 mb-4 font-bold uppercase tracking-widest text-xs">Translation</span>
                    <h3 className="text-3xl font-black text-white">{currentVocab?.translation}</h3>
                    <div className="mt-auto opacity-50"><RotateCw size={24} /></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="btn btn-outline flex-1 py-4 text-red-500 border-red-200 shadow-[0_4px_0_#fca5a5] active:shadow-none active:translate-y-1" onClick={handleNext}>
                  HARD
                </button>
                <button className="btn btn-primary flex-1 py-4" onClick={handleNext}>
                  EASY
                </button>
              </div>

              <h3 className="text-h3 mt-8 mb-4 border-t pt-6">Lessons</h3>
              <div className="card flex items-center justify-between border-blue-500 border-b-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    1
                  </div>
                  <span className="font-bold">Latest Words</span>
                </div>
                <ChevronRight className="text-gray-300" />
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'resources' && (
        <div className="text-center py-12 text-gray-400 font-bold">No resources uploaded yet.</div>
      )}
    </div>
  );
}
