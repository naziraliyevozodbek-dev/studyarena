'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, Copy, Loader2, Trash2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

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
    if (token) {
      fetchCourses();
    }
  }, [token]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.courses) {
        setCourses(data.courses);
      } else if (data.error) {
        console.error('Failed to fetch courses', data.error);
      }
    } catch (error) {
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
      toast.error("Xatolik: Avtorizatsiya tokeni topilmadi. Iltimos, Telegram ilovani yopib boshqatdan kiring yoki keshni tozalang!");
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
        toast.success("Kurs muvaffaqiyatli yaratildi");
      } else {
        console.error("API Error:", data.error);
        toast.error(`Kechirasiz, kurs yaratishda xatolik yuz berdi: ${data.error}.`);
      }
    } catch (err: unknown) {
      console.error("Network Error:", err);
      toast.error('Tarmoq xatosi: ' + (err instanceof Error ? err.message : String(err)));
    }
    setCreating(false);
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      toast.error("Xatolik: Token yo'q!");
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
        toast.success("Kurs o'chirildi");
      } else {
        console.error(data.error);
        toast.error("O'chirishda xatolik: " + data.error);
      }
    } catch (err: unknown) {
      toast.error("Tarmoq xatosi: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const copyCode = (code: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <div className="animate-fade-in relative h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 m-0">My Courses</h1>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-text-tertiary" /></div>
        ) : courses.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">No courses yet. Create one!</p>
        ) : courses.map(course => (
          <Card key={course.id} padding="none" className="overflow-hidden mb-3">
            <Link href={`/mentor/courses/${course.id}`} className="p-4 block hover:bg-bg-secondary transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-text-main text-base">{course.title}</h3>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Course">
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
              <Button 
                variant="primary"
                onClick={handleCreateCourse}
                disabled={creating}
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Course'}
              </Button>
            </div>
      </Modal>

      {/* Floating Action Button */}
      <button 
        onClick={handleOpenModal}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-active transition-transform active:scale-95 z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
