'use client';

import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Users, Plus, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Course = {
  id: string;
  title: string;
  description: string;
  course_code: string;
  _count?: {
    members: number;
  };
};

export default function MentorDashboard() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [supabase]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_members(count)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCourses(
        data.map((c: any) => ({
          ...c,
          _count: { members: c.course_members[0]?.count || 0 },
        }))
      );
    }
    setLoading(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    const courseCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase.from('courses').insert({
      title: newTitle,
      description: 'A new course',
      mentor_id: user?.id,
      course_code: courseCode,
    });

    if (!error) {
      setNewTitle('');
      fetchCourses();
    }
    setIsCreating(false);
  };

  return (
    <div className="animate-fade-in pb-32 px-4">
      {/* Header */}
      <div className="mb-6 pt-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-1">Mentor Dashboard</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Overview of your teaching progress.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="ios-card p-4">
          <div className="text-[var(--color-text-tertiary)] mb-2"><Users size={20} /></div>
          <div className="text-2xl font-bold text-[var(--color-text-main)]">0</div>
          <div className="text-xs text-[var(--color-text-secondary)] font-medium">Total Students</div>
        </div>
        <div className="ios-card p-4">
          <div className="text-[var(--color-text-tertiary)] mb-2"><BookOpen size={20} /></div>
          <div className="text-2xl font-bold text-[var(--color-text-main)]">{courses.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)] font-medium">Active Courses</div>
        </div>
      </div>

      {/* Create Course Form */}
      <div className="ios-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-main)] mb-3 flex items-center gap-2">
          <Plus size={18} className="text-[var(--color-primary)]" />
          New Course
        </h2>
        <form onSubmit={handleCreateCourse} className="flex flex-col gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course Name (e.g. English B2)"
            className="ios-input px-4 py-3 w-full"
            required
            disabled={isCreating}
          />
          <button 
            type="submit" 
            disabled={isCreating}
            className="ios-button py-3 flex justify-center items-center"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Create Course'}
          </button>
        </form>
      </div>

      {/* Courses List */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Your Courses</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
        </div>
      ) : courses.length === 0 ? (
        <div className="ios-card p-8 text-center bg-[var(--color-bg-secondary)] border-dashed">
          <BookOpen className="mx-auto text-[var(--color-text-tertiary)] mb-3" size={32} />
          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium">No courses created yet.</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map(course => (
            <Link href={`/mentor/courses/${course.id}`} key={course.id} className="active:scale-[0.98] transition-transform">
              <div className="ios-card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)] text-base mb-1">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course._count?.members || 0}
                    </span>
                    <span className="text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded border border-[var(--color-primary)]/10">
                      Code: {course.course_code}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-[var(--color-text-tertiary)]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
