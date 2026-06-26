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
  const [showNewCourse, setShowNewCourse] = useState(false);

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
        setShowNewCourse(false);
      } else {
        setErrorMsg(`API Xatosi: ${data.error || 'Nomaʼlum xatolik'}`);
      }
    } catch (err: unknown) {
      setErrorMsg(`Tizim xatosi: ${(err instanceof Error ? err.message : String(err))}`);
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

  const totalStudents = courses.reduce((sum, course) => sum + (course._count?.members || 0), 0);

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-6 pt-4 flex justify-between items-center mb-6 px-1">
        <h1 className="text-2xl font-bold text-text-main m-0">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl flex items-center gap-2" onClick={() => setShowNewCourse(true)}>
            <Plus size={18} /> Yangi
          </button>
        </div>
      </div>

      <div>
        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card padding="md">
            <div className="text-text-tertiary mb-2"><Users size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{totalStudents}</div>
            <div className="text-xs text-text-secondary font-medium">Total Students</div>
          </Card>
          <Card padding="md">
            <div className="text-text-tertiary mb-2"><BookOpen size={20} /></div>
            <div className="text-2xl font-bold text-text-main">{courses.length}</div>
            <div className="text-xs text-text-secondary font-medium">Active Courses</div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/mentor/challenges">
            <Card interactive padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-main text-sm">Challenges</h3>
                <p className="text-[10px] text-text-secondary">Manage tasks</p>
              </div>
            </Card>
          </Link>
          <Link href="/mentor/resources">
            <Card interactive padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-text-main text-sm">Resources</h3>
                <p className="text-[10px] text-text-secondary">Upload files</p>
              </div>
            </Card>
          </Link>
        </div>

      {/* Create Course Form */}
      {showNewCourse && (
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
      )}

      {/* Course List */}
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
                    <span className="text-text-main font-mono bg-bg-secondary px-2 py-0.5 rounded">
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
