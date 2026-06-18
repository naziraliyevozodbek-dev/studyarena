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
    <div className="animate-fade-in pb-32">
      {/* Header */}
      <div className="mb-8 pt-6 px-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Mentor Hub</h1>
        <p className="text-[var(--color-text-sub)]">Manage your courses and students.</p>
      </div>

      <div className="px-4">
        {/* Create Course Form */}
        <div className="glass-panel rounded-3xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20"></div>
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Plus size={16} className="text-[var(--color-accent)]" />
            Create New Course
          </h2>
          <form onSubmit={handleCreateCourse} className="flex flex-col gap-3 relative z-10">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Course Name (e.g. English B2)"
              className="w-full bg-black/20 border border-[var(--color-border)] rounded-2xl px-4 py-4 text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
              required
              disabled={isCreating}
            />
            <button 
              type="submit" 
              disabled={isCreating}
              className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center shadow-[var(--shadow-glow)] active:scale-[0.98]"
            >
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Create Course'}
            </button>
          </form>
        </div>

        {/* Courses List */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-bold text-white tracking-tight">Your Courses</h2>
          <div className="bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-0.5 rounded-md text-xs font-bold">
            {courses.length}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={40} />
          </div>
        ) : courses.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center border-dashed border-2">
            <BookOpen className="mx-auto text-[var(--color-border-hover)] mb-4" size={48} />
            <h3 className="text-[var(--color-text-sub)] font-medium">No courses yet. Create your first course above!</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map(course => (
              <Link href={`/mentor/courses/${course.id}`} key={course.id}>
                <div className="glass-panel glass-panel-hover rounded-2xl p-5 transition-all active:scale-[0.98] flex items-center justify-between group cursor-pointer relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--color-primary-light)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <h3 className="font-bold text-white text-xl mb-2 tracking-tight">{course.title}</h3>
                    <div className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-sub)]">
                      <span className="flex items-center gap-1.5 bg-black/30 border border-[var(--color-border)] px-2.5 py-1.5 rounded-lg text-white">
                        <Users size={14} className="text-[var(--color-accent)]" />
                        {course._count?.members || 0} Students
                      </span>
                      <span className="flex items-center gap-1.5 bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 px-2.5 py-1.5 rounded-lg text-[var(--color-accent)]">
                        Code: <span className="text-white tracking-wider">{course.course_code}</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--color-bg-surface-solid)] border border-[var(--color-border)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)] flex items-center justify-center text-[var(--color-text-muted)] transition-colors shadow-sm">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
