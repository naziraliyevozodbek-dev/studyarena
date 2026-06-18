'use client';

import { useSupabase } from '@/hooks/useSupabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Plus, FileText, Target, Loader2 } from 'lucide-react';

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [germanWord, setGermanWord] = useState('');
  const [translation, setTranslation] = useState('');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    
    // Fetch course
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    setCourse(courseData);

    // Fetch vocabularies
    const { data: vocabData } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (vocabData) setVocabularies(vocabData);
    
    setLoading(false);
  };

  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!germanWord.trim() || !translation.trim()) return;

    setIsAddingVocab(true);
    const { data, error } = await supabase.from('vocabularies').insert({
      course_id: courseId,
      lesson_number: 1, // Defaulting to 1 for MVP
      german_word: germanWord,
      translation: translation,
    }).select().single();

    if (!error && data) {
      setVocabularies([data, ...vocabularies]);
      setGermanWord('');
      setTranslation('');
    }
    setIsAddingVocab(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-[#6C4CF1]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-6 px-4">
        <button 
          onClick={() => router.back()} 
          className="w-12 h-12 glass-panel rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight">{course?.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest bg-[var(--color-primary-light)] px-2 py-0.5 rounded-md border border-[var(--color-primary)]/20">
              Code: {course?.course_code}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Vocabulary Management */}
        <div className="glass-panel rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white shadow-[var(--shadow-glow)]">
              <BookOpen size={20} />
            </div>
            <h2 className="font-bold text-white text-xl tracking-tight">Vocabulary</h2>
          </div>

          <form onSubmit={handleAddVocab} className="flex flex-col gap-4 mb-8 bg-black/20 p-5 rounded-2xl border border-[var(--color-border)]">
            <input
              type="text"
              placeholder="Word (e.g. Apfel)"
              value={germanWord}
              onChange={(e) => setGermanWord(e.target.value)}
              className="w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
              required
            />
            <input
              type="text"
              placeholder="Translation (e.g. Apple)"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="w-full bg-black/30 border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
              required
            />
            <button 
              type="submit" 
              disabled={isAddingVocab}
              className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex justify-center items-center shadow-[var(--shadow-glow)] active:scale-[0.98]"
            >
              {isAddingVocab ? <Loader2 className="animate-spin" size={20} /> : 'Add Word Live'}
            </button>
          </form>

          {/* Word List */}
          <div className="space-y-3">
            {vocabularies.length === 0 ? (
              <p className="text-sm text-[var(--color-text-sub)] text-center py-4">No vocabulary words added yet.</p>
            ) : (
              vocabularies.map(v => (
                <div key={v.id} className="flex justify-between items-center py-3 px-4 bg-[var(--color-bg-surface-solid)] border border-[var(--color-border)] rounded-xl">
                  <span className="font-bold text-white text-lg">{v.german_word}</span>
                  <span className="text-sm text-[var(--color-text-muted)] font-medium bg-black/30 px-3 py-1 rounded-lg">{v.translation}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Homework Placeholder */}
        <div className="glass-panel rounded-3xl p-6 opacity-60 border-dashed border-2">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={20} className="text-[var(--color-text-sub)]" />
            <h2 className="font-bold text-[var(--color-text-sub)] text-xl tracking-tight">Homework & Tasks</h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Coming soon in next iteration.</p>
        </div>
      </div>
    </div>
  );
}
