'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Loader2, Plus, Users, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function MentorDashboard() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const [courses, setCourses] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      const mappedData = data.courses?.map((course: any) => ({
        ...course,
        _count: {
          members: course._count?.[0]?.count || 0
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
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!token) {
      setErrorMsg("Xatolik: Avtorizatsiya tokeni topilmadi.");
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

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Serverdan yaroqsiz javob keldi (HTML/Matn). Serverda muammo bor.");
      }

      if (res.ok && data.course) {
        setNewTitle('');
        setSuccessMsg("Zo'r! Kurs muvaffaqiyatli yaratildi: " + data.course.title);
        fetchCourses(); // Refresh list
      } else {
        setErrorMsg(`API Xatosi: ${data.error || 'Nomaʼlum xatolik'}`);
      }
    } catch (err: any) {
      setErrorMsg(`Tizim xatosi: ${err.message}`);
    } finally {
      setIsCreating(false);
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
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-text-main mb-1">Mentor Dashboard</h1>
        <p className="text-text-secondary text-sm">Overview of your teaching progress.</p>
      </div>

      <div>
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
          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-200">
              {successMsg}
            </div>
          )}
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
    </div>
  );
}
