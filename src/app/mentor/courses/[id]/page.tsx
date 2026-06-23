'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen, FileText, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function CourseDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const router = useRouter();
  const supabase = useSupabase();
  const { user, token } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [vocabularies, setVocabularies] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'vocab' | 'homework' | 'students'>('vocab');
  
  // Vocab State
  const [germanWord, setGermanWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [exampleGerman, setExampleGerman] = useState('');
  const [exampleUzbek, setExampleUzbek] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkVocabText, setBulkVocabText] = useState('');
  
  // Homework State
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwXp, setHwXp] = useState('50');
  const [hwDeadline, setHwDeadline] = useState('');
  const [isAddingHw, setIsAddingHw] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      if (!token) return;
      const res = await fetch(`/api/courses/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      setCourse(data.course);
      setVocabularies(data.vocabularies || []);
      setHomeworks(data.homeworks || []);

      // Fetch students
      const studentsRes = await fetch(`/api/mentor/courses/${resolvedParams.id}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, token]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault();

    let bodyData: any = {};
    
    if (isBulkMode) {
      if (!bulkVocabText.trim()) return;
      const lines = bulkVocabText.split('\n').filter(line => line.trim() !== '');
      const words = lines.map(line => {
        const parts = line.includes('-') ? line.split('-') : line.split(',');
        return {
          course_id: resolvedParams.id,
          german_word: parts[0]?.trim() || '',
          translation: parts[1]?.trim() || ''
        };
      }).filter(w => w.german_word && w.translation);
      
      if (words.length === 0) {
        alert("Noto'g'ri format! Iltimos, Word - Translation shaklida kiriting.");
        return;
      }
      bodyData = { words };
    } else {
      if (!germanWord.trim() || !translation.trim()) return;
      bodyData = {
        course_id: resolvedParams.id,
        german_word: germanWord,
        translation: translation,
        example_german: exampleGerman || null,
        example_uzbek: exampleUzbek || null
      };
    }

    setIsAddingVocab(true);
    try {
      const res = await fetch(`/api/vocabularies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add vocab');
      }
      
      setGermanWord('');
      setTranslation('');
      setExampleGerman('');
      setExampleUzbek('');
      setBulkVocabText('');
      fetchCourseData();
    } catch (error: any) {
      console.error('Error adding vocab:', error);
      alert("Xatolik: " + error.message);
    } finally {
      setIsAddingVocab(false);
    }
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwXp) return;

    setIsAddingHw(true);
    try {
      const res = await fetch(`/api/homeworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: resolvedParams.id,
          title: hwTitle,
          description: hwDescription,
          xp_reward: parseInt(hwXp),
          deadline: hwDeadline || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add homework');
      }
      
      setHwTitle('');
      setHwDescription('');
      setHwXp('50');
      setHwDeadline('');
      fetchCourseData();
    } catch (error: any) {
      console.error('Error adding homework:', error);
      alert("Xatolik: " + error.message);
    } finally {
      setIsAddingHw(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Rostan ham bu kursni o'chirib tashlamoqchimisiz? Undagi barcha ma'lumotlar o'chib ketadi!")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/courses?id=${resolvedParams.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      router.push('/mentor');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      alert("Xatolik: " + error.message);
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
      <div className="flex items-center justify-between pt-4 mb-6">
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

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main mb-1">{course?.title}</h1>
          <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
            Course Code: <span className="font-mono bg-bg-secondary px-2 py-0.5 rounded text-text-main">{course?.course_code}</span>
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card padding="md" className={`${activeTab === 'vocab' ? 'ring-2 ring-primary border-transparent' : ''}`} onClick={() => setActiveTab('vocab')}>
            <div className="text-text-tertiary mb-2"><BookOpen size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{vocabularies.length}</div>
            <div className="text-xs text-text-secondary font-medium">Vocabulary</div>
          </Card>
          <Card padding="md" className={`${activeTab === 'homework' ? 'ring-2 ring-primary border-transparent' : ''}`} onClick={() => setActiveTab('homework')}>
            <div className="text-text-tertiary mb-2"><FileText size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{homeworks.length}</div>
            <div className="text-xs text-text-secondary font-medium">Homeworks</div>
          </Card>
          <Card padding="md" className={`${activeTab === 'students' ? 'ring-2 ring-primary border-transparent' : ''}`} onClick={() => setActiveTab('students')}>
            <div className="text-text-tertiary mb-2"><Users size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{students.length}</div>
            <div className="text-xs text-text-secondary font-medium">Students</div>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-bg-secondary rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'vocab' ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-secondary'}`}
          >
            Vocabulary
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'homework' ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-secondary'}`}
          >
            Homeworks
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'students' ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-secondary'}`}
          >
            Students
          </button>
        </div>

        {/* Vocabulary Tab Content */}
        {activeTab === 'vocab' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-text-main">Add Vocabulary</h2>
              <button 
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-sm text-primary font-semibold underline"
              >
                {isBulkMode ? "Single Word" : "Bulk Upload"}
              </button>
            </div>
            
            <Card padding="md" className="mb-8">
              <form onSubmit={handleAddVocab} className="flex flex-col gap-3">
                {isBulkMode ? (
                  <>
                    <p className="text-xs text-text-secondary">Pasting format: <code>Word - Translation</code>. Har bir qatorda bittadan so'z yozing.</p>
                    <textarea
                      placeholder={`Apfel - Olma\nHaus - Uy\nAuto - Mashina`}
                      value={bulkVocabText}
                      onChange={(e) => setBulkVocabText(e.target.value)}
                      className="w-full bg-bg-secondary text-text-main px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-border min-h-[150px]"
                      required
                    />
                  </>
                ) : (
                  <>
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
                    <Input
                      type="text"
                      placeholder="German Example (Optional)"
                      value={exampleGerman}
                      onChange={(e) => setExampleGerman(e.target.value)}
                    />
                    <Input
                      type="text"
                      placeholder="Uzbek Example (Optional)"
                      value={exampleUzbek}
                      onChange={(e) => setExampleUzbek(e.target.value)}
                    />
                  </>
                )}
                
                <Button type="submit" disabled={isAddingVocab} fullWidth className="mt-1">
                  {isAddingVocab ? <Loader2 className="animate-spin" size={20} /> : 'Save Word' + (isBulkMode ? 's' : '')}
                </Button>
              </form>
            </Card>

            <h2 className="text-lg font-semibold text-text-main mb-3">Word List</h2>
            <Card padding="none">
              {vocabularies.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">No vocabulary added yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {vocabularies.map(v => (
                    <div key={v.id} className="flex flex-col py-3 px-4 bg-bg-card">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-text-main">{v.german_word}</span>
                        <span className="text-sm text-text-secondary">{v.translation}</span>
                      </div>
                      {v.example_german && (
                        <span className="text-xs text-text-tertiary">📝 {v.example_german}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Homeworks Tab Content */}
        {activeTab === 'homework' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-text-main mb-3">Create Homework</h2>
            <Card padding="md" className="mb-8">
              <form onSubmit={handleAddHomework} className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Title (e.g. Lektion 1 Arbeitsbuch)"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Description (Optional)"
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary mb-1 block">XP Reward</label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={hwXp}
                      onChange={(e) => setHwXp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary mb-1 block">Deadline (Optional)</label>
                    <Input
                      type="date"
                      value={hwDeadline}
                      onChange={(e) => setHwDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isAddingHw} fullWidth className="mt-1">
                  {isAddingHw ? <Loader2 className="animate-spin" size={20} /> : 'Publish Homework'}
                </Button>
              </form>
            </Card>

            <h2 className="text-lg font-semibold text-text-main mb-3">Homework List</h2>
            <Card padding="none">
              {homeworks.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">No homeworks created yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {homeworks.map(hw => (
                    <div 
                      key={hw.id} 
                      className="p-4 bg-bg-card active:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => router.push(`/mentor/courses/${resolvedParams.id}/homeworks/${hw.id}`)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-text-main">{hw.title}</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+{hw.xp_reward} XP</span>
                      </div>
                      {hw.description && (
                        <p className="text-sm text-text-secondary line-clamp-1 mb-2">{hw.description}</p>
                      )}
                      <div className="flex justify-between items-center text-xs text-text-tertiary">
                        <span>{hw._count?.[0]?.count || 0} Submissions</span>
                        {hw.deadline && <span>Due: {new Date(hw.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Students Tab Content */}
        {activeTab === 'students' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-text-main mb-3">Enrolled Students</h2>
            <Card padding="none">
              {students.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-6">No students enrolled yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {students.map(student => (
                    <div 
                      key={student.id} 
                      className="p-4 bg-bg-card active:bg-bg-secondary transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/mentor/courses/${resolvedParams.id}/students/${student.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg-secondary text-text-main flex items-center justify-center font-bold">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            student.full_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-text-main text-sm">{student.full_name}</p>
                          <p className="text-xs text-text-secondary">View Analytics</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
