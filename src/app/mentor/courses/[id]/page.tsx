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
    <div className="animate-fade-in p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{course?.title}</h1>
          <p className="text-xs font-semibold text-[#6C4CF1] mt-0.5">Code: {course?.course_code}</p>
        </div>
      </div>

      {/* Vocabulary Management */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#ece9fe] text-[#6C4CF1] flex items-center justify-center">
            <BookOpen size={18} />
          </div>
          <h2 className="font-bold text-slate-900 text-lg">Vocabulary</h2>
        </div>

        <form onSubmit={handleAddVocab} className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <input
            type="text"
            placeholder="German Word"
            value={germanWord}
            onChange={(e) => setGermanWord(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6C4CF1]"
            required
          />
          <input
            type="text"
            placeholder="Translation"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6C4CF1]"
            required
          />
          <button 
            type="submit" 
            disabled={isAddingVocab}
            className="w-full bg-[#6C4CF1] text-white py-2 rounded-lg font-bold text-sm hover:bg-[#5534d1] disabled:opacity-50 mt-1 flex justify-center"
          >
            {isAddingVocab ? <Loader2 className="animate-spin" size={18} /> : 'Add Word'}
          </button>
        </form>

        {/* Word List */}
        <div className="space-y-2">
          {vocabularies.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No vocabulary words added yet.</p>
          ) : (
            vocabularies.map(v => (
              <div key={v.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="font-bold text-slate-800">{v.german_word}</span>
                <span className="text-sm text-slate-500 font-medium">{v.translation}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Homework Placeholder */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm opacity-50 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-slate-400" />
          <h2 className="font-bold text-slate-900 text-lg">Homework Tasks</h2>
        </div>
        <p className="text-xs text-slate-500">Coming soon in next iteration.</p>
      </div>

    </div>
  );
}
