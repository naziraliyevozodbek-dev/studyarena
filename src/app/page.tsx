'use client';

import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Flame, Gem, BookOpen, Target, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, isLoading, error } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();

  const [courseCode, setCourseCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [recentVocab, setRecentVocab] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect Mentors
  useEffect(() => {
    if (user?.role === 'mentor') {
      router.push('/mentor');
    }
  }, [user, router]);

  // Fetch student data & Setup Realtime
  useEffect(() => {
    if (!user || user.role === 'mentor') return;

    fetchStudentData();

    // Setup Realtime Listener for new vocabularies
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vocabularies',
        },
        (payload) => {
          // A new vocabulary was added! Prepend it to the list instantly.
          setRecentVocab((prev) => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const fetchStudentData = async () => {
    setLoadingData(true);
    // 1. Get enrolled courses
    const { data: members } = await supabase
      .from('course_members')
      .select('course_id, courses(*)')
      .eq('student_id', user?.id);

    const courses = members?.map((m: any) => m.courses) || [];
    setEnrolledCourses(courses);

    // 2. Get recent vocabularies from enrolled courses
    if (courses.length > 0) {
      const courseIds = courses.map(c => c.id);
      const { data: vocabs } = await supabase
        .from('vocabularies')
        .select('*')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (vocabs) setRecentVocab(vocabs);
    }
    
    setLoadingData(false);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setEnrolling(true);
    // Find course by code
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('course_code', courseCode.toUpperCase())
      .single();

    if (course) {
      // Enroll
      await supabase.from('course_members').insert({
        course_id: course.id,
        student_id: user?.id
      });
      setCourseCode('');
      fetchStudentData(); // Refresh data
    } else {
      alert('Course not found');
    }
    setEnrolling(false);
  };

  if (isLoading || (user?.role === 'student' && loadingData)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-bounce-sm text-slate-400 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#ece9fe] text-[#6C4CF1] rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} />
          </div>
          <p className="font-bold text-slate-500">Loading StudyArena...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">Welcome!</h1>
        <p className="text-sm font-medium text-slate-500 mb-6">
          {error ? `Error: ${error}` : 'Please open this app inside Telegram.'}
        </p>
      </div>
    );
  }

  // Prevent rendering student UI for mentors before redirect finishes
  if (user.role === 'mentor') return null;

  return (
    <div className="animate-fade-in pb-24">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-8 pt-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--color-border)]">
            {user.avatar_url ? (
               <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] flex items-center justify-center font-bold text-lg">
                 {user.full_name.charAt(0)}
               </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-main)]">{user.full_name}</h1>
            <p className="text-sm font-medium text-[var(--color-text-tertiary)]">Student</p>
          </div>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="px-4">
          <div className="ios-card p-6 text-center mb-6">
            <Target size={32} className="mx-auto text-[var(--color-text-tertiary)] mb-4" />
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-1">No Courses</h2>
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">Join a course using the code provided by your mentor.</p>
            
            <form onSubmit={handleEnroll} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Course Code" 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="ios-input px-4 py-3.5 text-center text-lg tracking-widest font-semibold uppercase placeholder:normal-case"
                maxLength={6}
                required
              />
              <button 
                type="submit" 
                disabled={enrolling}
                className="ios-button py-3.5 flex justify-center items-center"
              >
                {enrolling ? <Loader2 className="animate-spin" size={20} /> : 'Join Course'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* iOS Style Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="ios-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[var(--color-text-tertiary)] text-xs font-medium mb-1">XP</span>
              <span className="text-xl font-semibold text-[var(--color-primary)]">{user.xp || 0}</span>
            </div>
            <div className="ios-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[var(--color-text-tertiary)] text-xs font-medium mb-1">Streak</span>
              <span className="text-xl font-semibold text-[var(--color-success)]">{user.streak || 0}</span>
            </div>
            <div className="ios-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[var(--color-text-tertiary)] text-xs font-medium mb-1">Level</span>
              <span className="text-xl font-semibold text-[var(--color-text-main)]">1</span>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
             <Link href="/learn" className="ios-card p-4 active:scale-95 transition-transform">
               <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-3">
                 <BookOpen size={20} />
               </div>
               <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Vocabulary</h3>
               <p className="text-xs text-[var(--color-text-secondary)]">{recentVocab.length} words to practice</p>
             </Link>
             <Link href="/tasks" className="ios-card p-4 active:scale-95 transition-transform">
               <div className="w-10 h-10 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] flex items-center justify-center mb-3">
                 <CheckSquare size={20} />
               </div>
               <h3 className="font-semibold text-[var(--color-text-main)] mb-1">Homework</h3>
               <p className="text-xs text-[var(--color-text-secondary)]">0 pending tasks</p>
             </Link>
          </div>

          {/* Recent Vocabulary Section */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-main)] tracking-tight">Recent Words</h3>
            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">{enrolledCourses[0]?.title}</span>
          </div>
          
          <div className="ios-card overflow-hidden">
            {recentVocab.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">No words added yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {recentVocab.slice(0, 5).map((v, i) => (
                  <div key={v.id || i} className="p-4 flex items-center justify-between bg-[var(--color-bg-card)]">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[var(--color-text-main)] text-base">{v.german_word}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">{v.translation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
