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
      <div className="flex items-center gap-3 pt-4 px-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-[var(--color-primary)] active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Back</span>
          </div>
        </button>
      </div>

      <div className="px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{course?.title}</h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
            Course Code: <span className="font-mono bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded text-[var(--color-text-main)]">{course?.course_code}</span>
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="ios-card p-4">
            <div className="text-[var(--color-text-tertiary)] mb-2"><BookOpen size={20} /></div>
            <div className="text-2xl font-bold text-[var(--color-text-main)]">{vocabularies.length}</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium">Vocabulary</div>
          </div>
          <div className="ios-card p-4">
            <div className="text-[var(--color-text-tertiary)] mb-2"><FileText size={20} /></div>
            <div className="text-2xl font-bold text-[var(--color-text-main)]">0</div>
            <div className="text-xs text-[var(--color-text-secondary)] font-medium">Homeworks</div>
          </div>
        </div>

        {/* Vocabulary Management */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-3">Add Vocabulary</h2>
          <div className="ios-card p-4">
            <form onSubmit={handleAddVocab} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Word (e.g. Apfel)"
                value={germanWord}
                onChange={(e) => setGermanWord(e.target.value)}
                className="ios-input px-4 py-3"
                required
              />
              <input
                type="text"
                placeholder="Translation (e.g. Apple)"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="ios-input px-4 py-3"
                required
              />
              <button 
                type="submit" 
                disabled={isAddingVocab}
                className="ios-button py-3 mt-1 flex justify-center items-center"
              >
                {isAddingVocab ? <Loader2 className="animate-spin" size={20} /> : 'Save Word'}
              </button>
            </form>
          </div>
        </div>

        {/* Word List */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-3">Word List</h2>
          <div className="ios-card overflow-hidden">
            {vocabularies.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-6">No vocabulary added yet.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {vocabularies.map(v => (
                  <div key={v.id} className="flex justify-between items-center py-3 px-4 bg-[var(--color-bg-card)]">
                    <span className="font-medium text-[var(--color-text-main)]">{v.german_word}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">{v.translation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
