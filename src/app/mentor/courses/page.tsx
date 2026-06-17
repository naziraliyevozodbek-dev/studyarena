'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, Copy, Loader2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';

type Course = {
  id: string;
  title: string;
  course_code: string;
  _count?: { course_members: number }; // we'll approximate or fetch separately
};

export default function MentorCourses() {
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);

  const supabase = useSupabase();
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    // Fetch courses where mentor_id matches. (Handled by RLS anyway)
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, course_code');
    
    if (data) {
      // In a real app we'd also fetch the student count.
      setCourses(data);
    } else if (error) {
      console.error('Failed to fetch courses', error);
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    const code = 'GER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewCode(code);
    setNewTitle('');
    setShowModal(true);
  };

  const handleCreateCourse = async () => {
    if (!newTitle) return;
    setCreating(true);
    
    const { data, error } = await supabase
      .from('courses')
      .insert([
        { 
          title: newTitle, 
          course_code: newCode,
          mentor_id: user?.id 
        }
      ])
      .select();

    if (data) {
      setCourses(prev => [...prev, data[0]]);
      setShowModal(false);
    } else {
      console.error(error);
      alert('Failed to create course');
    }
    setCreating(false);
  };

  const copyCode = (code: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    navigator.clipboard.writeText(code);
    alert('Code copied!');
  };

  return (
    <div className="animate-fade-in relative h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="saas-header m-0">My Courses</h1>
        <button 
          onClick={handleOpenModal}
          className="saas-btn saas-btn-primary w-auto text-xs py-2 px-3 rounded-lg"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : courses.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No courses yet. Create one!</p>
        ) : courses.map(course => (
          <div key={course.id} className="saas-card p-0 overflow-hidden m-0">
            <Link href={`/mentor/courses/${course.id}`} className="p-5 block hover:bg-slate-50 transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900">{course.title}</h3>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <button 
                  onClick={(e) => copyCode(course.course_code, e)}
                  className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition"
                >
                  <Copy size={12} /> {course.course_code}
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Course</h2>
            
            <label className="saas-label">Course Title</label>
            <input 
              type="text" 
              className="saas-input" 
              placeholder="e.g. German C1 Advanced"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)} 
            />

            <label className="saas-label">Course Code</label>
            <div className="flex gap-2 mb-6">
              <input type="text" className="saas-input mb-0 font-mono bg-slate-50" value={newCode} readOnly />
              <button className="saas-btn saas-btn-secondary w-auto px-3" onClick={() => copyCode(newCode)}>
                <Copy size={16} />
              </button>
            </div>

            <div className="flex gap-3">
              <button className="saas-btn saas-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button 
                className="saas-btn saas-btn-primary" 
                onClick={handleCreateCourse}
                disabled={creating}
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
