'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function CourseDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useSupabase();
  const { user, token } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [germanWord, setGermanWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/courses/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      setCourse(data.course);
      setVocabularies(data.vocabularies || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, token]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!germanWord.trim() || !translation.trim()) return;

    setIsAddingVocab(true);
    try {
      const res = await fetch(`/api/vocabularies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: params.id,
          german_word: germanWord,
          translation: translation
        })
      });

      if (!res.ok) throw new Error('Failed to add vocab');
      
      setGermanWord('');
      setTranslation('');
      fetchCourseData();
    } catch (error) {
      console.error('Error adding vocab:', error);
      alert("Xatolik yuz berdi");
    } finally {
      setIsAddingVocab(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Rostan ham bu kursni o'chirib tashlamoqchimisiz? Undagi barcha ma'lumotlar o'chib ketadi!")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/courses?id=${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/mentor');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert("Xatolik: Kursni o'chirib bo'lmadi");
    } finally {
      setIsDeleting(false);
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
    <div className="animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 px-4 mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-primary active:opacity-70 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft size={22} />
            <span className="text-lg">Back</span>
          </div>
        </button>
        <button
          onClick={handleDeleteCourse}
          disabled={isDeleting}
          className="text-red-500 active:opacity-70 transition-opacity p-2 bg-red-50 rounded-full"
        >
          {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
        </button>
      </div>

      <div className="px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main mb-1">{course?.title}</h1>
          <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
            Course Code: <span className="font-mono bg-bg-secondary px-2 py-0.5 rounded text-text-main">{course?.course_code}</span>
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Card padding="md">
            <div className="text-text-tertiary mb-2"><BookOpen size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{vocabularies.length}</div>
            <div className="text-xs text-text-secondary font-medium">Vocabulary</div>
          </Card>
          <Card padding="md">
            <div className="text-text-tertiary mb-2"><FileText size={20} /></div>
            <div className="text-2xl font-bold text-text-main">0</div>
            <div className="text-xs text-text-secondary font-medium">Homeworks</div>
          </Card>
        </div>

        {/* Vocabulary Management */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-main mb-3">Add Vocabulary</h2>
          <Card padding="md">
            <form onSubmit={handleAddVocab} className="flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Word (e.g. Apfel)"
                value={germanWord}
                onChange={(e) => setGermanWord(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Translation (e.g. Apple)"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                required
              />
              <Button type="submit" disabled={isAddingVocab} fullWidth className="mt-1">
                {isAddingVocab ? <Loader2 className="animate-spin" size={20} /> : 'Save Word'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Word List */}
        <div>
          <h2 className="text-lg font-semibold text-text-main mb-3">Word List</h2>
          <Card padding="none">
            {vocabularies.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">No vocabulary added yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {vocabularies.map(v => (
                  <div key={v.id} className="flex justify-between items-center py-3 px-4 bg-bg-card">
                    <span className="font-medium text-text-main">{v.german_word}</span>
                    <span className="text-sm text-text-secondary">{v.translation}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
