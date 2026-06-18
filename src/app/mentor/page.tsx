'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Plus, Users, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function MentorDashboard() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          _count:course_members (count)
        `)
        .eq('mentor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = data?.map(course => ({
        ...course,
        _count: {
          members: course._count[0]?.count || 0
        }
      })) || [];
      
      setCourses(mappedData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    if (!token) {
      alert("Xatolik: Avtorizatsiya tokeni topilmadi. Iltimos, Telegram ilovani yopib boshqatdan kiring yoki keshni tozalang!");
      return;
    }

    setIsCreating(true);
    const courseCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          course_code: courseCode
        })
      });

      const data = await res.json();

      if (res.ok && data.course) {
        setNewTitle('');
        fetchCourses(); // Refresh list
      } else {
        console.error("API Error:", data.error);
        alert(`Kechirasiz, kurs yaratishda xatolik yuz berdi: ${data.error}. Iltimos, Telegram keshni tozalab qayta kiring.`);
      }
    } catch (err: any) {
      console.error("Network Error:", err);
      alert('Tarmoq xatosi: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-fade-in pb-32 px-4">
      {/* Header */}
      <div className="mb-6 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-text-main">Mentor Dashboard</h1>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            v2.1 (Yangi!)
          </span>
        </div>
        <p className="text-text-secondary text-sm">Overview of your teaching progress.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card padding="md">
          <div className="text-text-tertiary mb-2"><Users size={20} /></div>
          <div className="text-2xl font-bold text-text-main">0</div>
          <div className="text-xs text-text-secondary font-medium">Total Students</div>
        </Card>
        <Card padding="md">
          <div className="text-text-tertiary mb-2"><BookOpen size={20} /></div>
          <div className="text-2xl font-bold text-text-main">{courses.length}</div>
          <div className="text-xs text-text-secondary font-medium">Active Courses</div>
        </Card>
      </div>

      {/* Create Course Form */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          New Course
        </h2>
        <form onSubmit={handleCreateCourse} className="flex flex-col gap-3">
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course Name (e.g. English B2)"
            required
            disabled={isCreating}
          />
          <Button type="submit" disabled={isCreating} fullWidth>
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Create Course'}
          </Button>
        </form>
      </Card>

      {/* Courses List */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-semibold text-text-main">Your Courses</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : courses.length === 0 ? (
        <Card padding="lg" className="text-center bg-bg-secondary border-dashed">
          <BookOpen className="mx-auto text-text-tertiary mb-3" size={32} />
          <h3 className="text-text-secondary text-sm font-medium">No courses created yet.</h3>
        </Card>
      ) : (
        <div className="grid gap-3">
          {courses.map(course => (
            <Link href={`/mentor/courses/${course.id}`} key={course.id}>
              <Card interactive padding="md" className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-main text-base mb-1">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course._count?.members || 0}
                    </span>
                    <span className="text-primary bg-primary-light px-2 py-0.5 rounded border border-primary/10">
                      Code: {course.course_code}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-text-tertiary" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
