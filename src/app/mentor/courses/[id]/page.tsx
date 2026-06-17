'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Target, FileText, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';

type Vocab = { id: string; lesson_number: number; german_word: string; translation: string };

export default function CourseContentManagement({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'vocab' | 'challenges' | 'resources'>('vocab');
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);

  // New Vocab Form
  const [showVocabForm, setShowVocabForm] = useState(false);
  const [newGerman, setNewGerman] = useState('');
  const [newTrans, setNewTrans] = useState('');
  const [newLesson, setNewLesson] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const supabase = useSupabase();

  useEffect(() => {
    fetchVocabs();
  }, [params.id]);

  const fetchVocabs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vocabularies')
      .select('*')
      .eq('course_id', params.id)
      .order('created_at', { ascending: false });
    
    if (data) setVocabs(data);
    setLoading(false);
  };

  const handleAddVocab = async () => {
    if (!newGerman || !newTrans) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('vocabularies')
      .insert([{
        course_id: params.id,
        lesson_number: newLesson,
        german_word: newGerman,
        translation: newTrans
      }])
      .select();
      
    if (data) {
      setVocabs(prev => [data[0], ...prev]);
      setShowVocabForm(false);
      setNewGerman('');
      setNewTrans('');
      
      // Send Telegram notification
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vocab',
          courseId: params.id,
          data: { lesson_number: newLesson, word: newGerman }
        })
      }).catch(console.error);

    } else {
      alert('Error adding vocab: ' + error?.message);
    }
    setSubmitting(false);
  };

  const handleDeleteVocab = async (id: string) => {
    if (!confirm('Delete this word?')) return;
    await supabase.from('vocabularies').delete().eq('id', id);
    setVocabs(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="saas-header mb-1">Manage Course</h1>
        <p className="text-sm text-slate-500">Course ID: {params.id.slice(0,8)}...</p>
      </div>

      <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
        <button 
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'vocab' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen size={14} /> Vocab
        </button>
        <button className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'challenges' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
          <Target size={14} /> Quests
        </button>
        <button className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'resources' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
          <FileText size={14} /> Files
        </button>
      </div>

      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {!showVocabForm ? (
            <button 
              onClick={() => setShowVocabForm(true)}
              className="saas-btn saas-btn-secondary w-full border-dashed border-2 py-4 text-slate-500 hover:text-slate-700 hover:border-slate-400"
            >
              <Plus size={18} /> Add New Word
            </button>
          ) : (
            <div className="saas-card m-0 p-4 bg-slate-50 border-blue-200">
              <h3 className="font-bold mb-3 text-sm">New Flashcard</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="saas-label text-[11px]">Word (Target Language)</label>
                  <input type="text" className="saas-input mb-0" value={newGerman} onChange={e=>setNewGerman(e.target.value)} placeholder="e.g. Der Apfel" />
                </div>
                <div>
                  <label className="saas-label text-[11px]">Translation</label>
                  <input type="text" className="saas-input mb-0" value={newTrans} onChange={e=>setNewTrans(e.target.value)} placeholder="The Apple" />
                </div>
              </div>
              <div className="mb-4">
                <label className="saas-label text-[11px]">Lesson Number</label>
                <input type="number" className="saas-input mb-0 w-24" value={newLesson} onChange={e=>setNewLesson(parseInt(e.target.value))} />
              </div>
              <div className="flex gap-2">
                <button className="saas-btn saas-btn-secondary flex-1" onClick={() => setShowVocabForm(false)}>Cancel</button>
                <button className="saas-btn saas-btn-primary flex-1" onClick={handleAddVocab} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Word'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : vocabs.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">No vocabulary found for this course.</p>
          ) : (
            vocabs.map(vocab => (
              <div key={vocab.id} className="saas-card m-0 p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Lesson {vocab.lesson_number}</span>
                  <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteVocab(vocab.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{vocab.german_word}</h4>
                  <p className="text-sm text-slate-500">{vocab.translation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
