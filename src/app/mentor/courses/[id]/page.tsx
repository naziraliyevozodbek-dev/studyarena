'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users, BookOpen, CheckCircle, XCircle, Plus, FileText, Image as ImageIcon, Camera, MoreVertical, Edit2, Trash2, ChevronRight, BarChart2, CheckSquare, Target, Flame, TrendingUp, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { toast } from 'sonner';

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
  const [category, setCategory] = useState('');
  const [germanWord, setGermanWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [exampleGerman, setExampleGerman] = useState('');
  const [exampleUzbek, setExampleUzbek] = useState('');
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkVocabText, setBulkVocabText] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Edit Vocab State
  const [editWordId, setEditWordId] = useState<string | null>(null);
  const [editGerman, setEditGerman] = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [editExampleG, setEditExampleG] = useState('');
  const [editExampleU, setEditExampleU] = useState('');
  const [isUpdatingVocab, setIsUpdatingVocab] = useState(false);
  
  // Homework State
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwXp, setHwXp] = useState('50');
  const [hwDeadline, setHwDeadline] = useState('');
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
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
        const parts = line.includes('\t') ? line.split('\t') : (line.includes('-') ? line.split('-') : line.split(','));
        return {
          course_id: resolvedParams.id,
          german_word: parts[0]?.trim() || '',
          translation: parts[1]?.trim() || '',
          example_german: parts[2]?.trim() || null,
          example_uzbek: parts[3]?.trim() || null,
          category: category.trim() || undefined
        };
      }).filter(w => w.german_word && w.translation);
      
      if (words.length === 0) {
        toast.error("Noto'g'ri format! Excel'dan nusxalang yoki Word - Translation shaklida kiriting.");
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
        example_uzbek: exampleUzbek || null,
        category: category.trim() || undefined
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
      toast.success("Vocabulary qo'shildi!");
    } catch (error: any) {
      console.error('Error adding vocab:', error);
      toast.error("Xatolik: " + error.message);
    } finally {
      setIsAddingVocab(false);
    }
  };

  const handleRenameCategory = async (oldCategory: string) => {
    const newCategoryName = window.prompt("Yangi kategoriya nomini kiriting:", oldCategory);
    if (!newCategoryName || newCategoryName.trim() === '' || newCategoryName === oldCategory) return;
    
    try {
      const res = await fetch(`/api/mentor/vocabularies/rename-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: resolvedParams.id,
          oldCategory: oldCategory,
          newCategory: newCategoryName.trim()
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nomini o'zgartirib bo'lmadi");
      }
      toast.success("Kategoriya nomi o'zgartirildi!");
      fetchCourseData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateVocab = async (id: string) => {
    if (!editGerman.trim() || !editTranslation.trim()) return;
    setIsUpdatingVocab(true);
    try {
      const res = await fetch(`/api/vocabularies?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          german_word: editGerman,
          translation: editTranslation,
          example_german: editExampleG,
          example_uzbek: editExampleU,
        })
      });
      if (!res.ok) throw new Error('Failed to update vocabulary');
      
      setVocabularies(prev => prev.map(v => v.id === id ? {
        ...v,
        german_word: editGerman,
        translation: editTranslation,
        example_german: editExampleG,
        example_uzbek: editExampleU,
      } : v));
      
      setEditWordId(null);
      toast.success("So'z yangilandi!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingVocab(false);
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
      setHwDeadline('');
      setHwXp('50');
      setShowHomeworkModal(false);
      fetchCourseData();
      toast.success("Homework yaratildi!");
    } catch (error: any) {
      console.error('Error adding homework:', error);
      toast.error("Xatolik: " + error.message);
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
      toast.success("Kurs o'chirildi!");
      router.push('/mentor');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error("Xatolik: " + error.message);
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

  const uniqueCategories = Array.from(new Set(vocabularies.map(v => v.category || "Asosiy so'zlar")));
  
  const groupedVocabs = vocabularies.reduce((acc, v) => {
    const cat = v.category || "Asosiy so'zlar";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, typeof vocabularies>);

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
        <div className="mb-6 mt-4 relative z-10 bg-bg-base/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-border">
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
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Kategoriya (masalan: Kasblar, 1-dars)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    className="mb-2"
                  />
                  {showCategoryDropdown && uniqueCategories.length > 0 && (
                    <div className="absolute top-[calc(100%-8px)] left-0 w-full bg-bg-secondary/95 backdrop-blur-md border border-border rounded-xl shadow-2xl max-h-40 overflow-y-auto z-50">
                      {uniqueCategories.map((c, i) => (
                        <div 
                          key={i} 
                          className="px-4 py-3 hover:bg-primary/10 cursor-pointer text-sm font-medium text-text-main transition-colors border-b border-border/50 last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategory(c as string);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {c as string}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {isBulkMode ? (
                  <>
                    <p className="text-xs text-text-secondary">Pasting format: Excel/Word dan nusxalang (Tab) yoki <code>nemischa - uzbekcha - nemischa misol (ixtiyoriy) - uzbekcha misol (ixtiyoriy)</code></p>
                    <textarea
                      placeholder={`Apfel - Olma - Ich esse einen Apfel - Men olma yeyapman\nHaus - Uy\nAuto - Mashina`}
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
                  {Object.entries(groupedVocabs).map(([cat, words]) => (
                    <div key={cat} className="flex flex-col bg-bg-card">
                      <div 
                        className="flex justify-between items-center py-3 px-4 cursor-pointer hover:bg-bg-secondary transition-colors"
                        onClick={() => setOpenCategory(openCategory === cat ? null : cat)}
                      >
                        <span className="font-bold text-text-main">{cat}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">{(words as any[]).length} ta so'z</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRenameCategory(cat); }}
                              className="p-1.5 text-text-tertiary hover:text-primary transition-colors"
                              title="Nomini o'zgartirish"
                            >
                              <Pencil size={14} />
                            </button>
                            {openCategory === cat ? <ChevronUp size={16} className="text-text-secondary"/> : <ChevronDown size={16} className="text-text-secondary"/>}
                        </div>
                      </div>
                      {openCategory === cat && (
                        <div className="divide-y divide-border bg-bg-secondary/30">
                          {(words as any[]).map(v => (
                            <div key={v.id} className="flex flex-col py-2 px-4">
                              {editWordId === v.id ? (
                                <div className="flex flex-col gap-2 py-2">
                                  <div className="flex gap-2">
                                    <Input 
                                      value={editGerman} 
                                      onChange={(e) => setEditGerman(e.target.value)} 
                                      placeholder="German word"
                                      className="flex-1"
                                    />
                                    <Input 
                                      value={editTranslation} 
                                      onChange={(e) => setEditTranslation(e.target.value)} 
                                      placeholder="Translation"
                                      className="flex-1"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Input 
                                      value={editExampleG} 
                                      onChange={(e) => setEditExampleG(e.target.value)} 
                                      placeholder="German Example"
                                      className="flex-1"
                                    />
                                    <Input 
                                      value={editExampleU} 
                                      onChange={(e) => setEditExampleU(e.target.value)} 
                                      placeholder="Uzbek Example"
                                      className="flex-1"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 mt-1">
                                    <button 
                                      onClick={() => setEditWordId(null)}
                                      className="p-1.5 bg-bg-secondary text-text-secondary rounded-lg hover:text-text-main transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateVocab(v.id)}
                                      disabled={isUpdatingVocab}
                                      className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-active transition-colors flex items-center justify-center"
                                    >
                                      {isUpdatingVocab ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="group flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-text-main">{v.german_word}</span>
                                      <span className="text-sm text-text-secondary">{v.translation}</span>
                                    </div>
                                    {v.example_german && (
                                      <span className="text-xs text-text-tertiary block">📝 {v.example_german}</span>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setEditWordId(v.id);
                                      setEditGerman(v.german_word);
                                      setEditTranslation(v.translation);
                                      setEditExampleG(v.example_german || '');
                                      setEditExampleU(v.example_uzbek || '');
                                    }}
                                    className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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
          <div className="animate-fade-in pb-24">
            <Modal isOpen={showHomeworkModal} onClose={() => setShowHomeworkModal(false)} title="New Homework">
              <form onSubmit={handleAddHomework} className="flex flex-col gap-4">
                <Input
                  label="Title"
                  type="text"
                  placeholder="e.g. Lektion 1 Arbeitsbuch"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  required
                />
                <Input
                  label="Description (Optional)"
                  type="text"
                  placeholder="Extra instructions"
                  value={hwDescription}
                  onChange={(e) => setHwDescription(e.target.value)}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="XP Reward"
                      type="number"
                      placeholder="50"
                      value={hwXp}
                      onChange={(e) => setHwXp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Deadline (Optional)"
                      type="date"
                      className="[color-scheme:light] dark:[color-scheme:dark]"
                      value={hwDeadline}
                      onChange={(e) => setHwDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isAddingHw} fullWidth className="mt-2">
                  {isAddingHw ? <Loader2 className="animate-spin" size={20} /> : 'Publish Homework'}
                </Button>
              </form>
            </Modal>

            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-semibold text-text-main">Homework List</h2>
            </div>
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

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button 
                onClick={() => setShowHomeworkModal(true)}
                className="rounded-full shadow-xl shadow-primary/20 px-6 py-3"
              >
                <Plus size={20} className="mr-2" />
                Yangi
              </Button>
            </div>
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
                  {[...students].sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0)).map((student, index) => (
                    <div 
                      key={student.id} 
                      className="p-4 bg-bg-card active:bg-bg-secondary transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => router.push(`/mentor/courses/${resolvedParams.id}/students/${student.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-6">
                          <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-text-tertiary'}`}>
                            #{index + 1}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-bg-secondary text-text-main flex items-center justify-center font-bold">
                          {student.avatar_url ? (
                            <Image src={student.avatar_url} width={32} height={32} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            student.full_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-text-main text-sm">{student.full_name}</p>
                          <p className="text-xs text-text-secondary">View Analytics</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-primary text-sm">+{student.weeklyXp || 0} XP</span>
                        <span className="text-xs text-text-secondary font-medium">Bu hafta</span>
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
