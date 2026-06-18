'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, Copy, Loader2, Trash2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
  const { user, token } = useAuth();

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
    
    if (!token) {
      alert("Xatolik: Avtorizatsiya tokeni topilmadi. Iltimos, Telegram ilovani yopib boshqatdan kiring yoki keshni tozalang!");
      return;
    }

    setCreating(true);
    
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          course_code: newCode
        })
      });

      const data = await res.json();
      
      if (res.ok && data.course) {
        setCourses(prev => [...prev, data.course]);
        setShowModal(false);
      } else {
        console.error("API Error:", data.error);
        alert(`Kechirasiz, kurs yaratishda xatolik yuz berdi: ${data.error}. Iltimos, Telegram keshni tozalab qayta kiring.`);
      }
    } catch (err: any) {
      console.error("Network Error:", err);
      alert('Tarmoq xatosi: ' + err.message);
    }
    setCreating(false);
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      alert("Xatolik: Token yo'q!");
      return;
    }

    if (!confirm("Haqiqatan ham bu kursni o'chirmokchimisiz?")) return;
    
    try {
      const res = await fetch(`/api/courses?id=${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
      } else {
        console.error(data.error);
        alert("O'chirishda xatolik: " + data.error);
      }
    } catch (err: any) {
      alert("Tarmoq xatosi: " + err.message);
    }
  };

  const copyCode = (code: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    navigator.clipboard.writeText(code);
    alert('Code copied!');
  };

  return (
    <div className="animate-fade-in relative h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 m-0">My Courses</h1>
        <Button 
          onClick={handleOpenModal}
          variant="primary"
          className="w-auto text-xs py-2 px-3 rounded-lg"
        >
          <Plus size={16} /> New
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-text-tertiary" /></div>
        ) : courses.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">No courses yet. Create one!</p>
        ) : courses.map(course => (
          <Card key={course.id} className="p-0 overflow-hidden m-0">
            <Link href={`/mentor/courses/${course.id}`} className="p-5 block hover:bg-bg-secondary transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-text-main">{course.title}</h3>
                <ChevronRight size={18} className="text-text-tertiary" />
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary">
                <button 
                  onClick={(e) => copyCode(course.course_code, e)}
                  className="flex items-center gap-1.5 bg-bg-secondary px-2 py-1 rounded hover:bg-border transition"
                >
                  <Copy size={12} /> {course.course_code}
                </button>
                <button
                  onClick={(e) => handleDeleteCourse(course.id, e)}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500/20 transition ml-auto"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-bg-card rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-lg font-bold text-text-main mb-4">Create New Course</h2>
            
            <label className="block text-sm font-bold text-text-secondary mb-1">Course Title</label>
            <Input 
              type="text" 
              placeholder="e.g. German C1 Advanced"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)} 
              className="mb-4"
            />

            <label className="block text-sm font-bold text-text-secondary mb-1">Course Code</label>
            <div className="flex gap-2 mb-6">
              <Input type="text" className="mb-0 font-mono bg-bg-secondary" value={newCode} readOnly />
              <Button variant="secondary" className="w-auto px-3" onClick={() => copyCode(newCode)}>
                <Copy size={16} />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                variant="primary"
                onClick={handleCreateCourse}
                disabled={creating}
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
