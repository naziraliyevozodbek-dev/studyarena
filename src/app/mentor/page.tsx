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
    <div className="animate-fade-in p-4 pb-24">
      <div className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Mentor Dashboard</h1>
        <p className="text-sm text-slate-500">Manage your courses and students.</p>
      </div>

      {/* Create Course Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Plus size={16} className="text-[#6C4CF1]" />
          Create New Course
        </h2>
        <form onSubmit={handleCreateCourse} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Course Name (e.g. English B2)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6C4CF1] transition-colors"
            required
            disabled={isCreating}
          />
          <button 
            type="submit" 
            disabled={isCreating}
            className="bg-[#6C4CF1] text-white px-5 rounded-xl font-bold text-sm hover:bg-[#5534d1] transition-colors disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Create'}
          </button>
        </form>
      </div>

      {/* Courses List */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">Your Courses</h2>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-[#6C4CF1]" size={32} />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200 border-dashed">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-slate-500 font-medium">No courses yet. Create your first course above!</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map(course => (
            <Link href={`/mentor/courses/${course.id}`} key={course.id}>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] flex items-center justify-between group">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{course.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                      <Users size={14} />
                      {course._count?.members || 0} Students
                    </span>
                    <span className="text-[#6C4CF1] bg-[#ece9fe] px-2 py-1 rounded-md border border-[#6C4CF1]/20">
                      Code: {course.course_code}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#ece9fe] flex items-center justify-center text-slate-400 group-hover:text-[#6C4CF1] transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
