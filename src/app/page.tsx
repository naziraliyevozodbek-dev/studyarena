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
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-6 pt-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
            {user.avatar_url ? (
               <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-[#ece9fe] text-[#6C4CF1] flex items-center justify-center font-bold text-lg">
                 {user.full_name.charAt(0)}
               </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-500">Hello,</h2>
            <h1 className="text-lg font-bold text-slate-900">{user.full_name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#F59E0B] bg-[#FFFBEB] px-3 py-1.5 rounded-full shadow-sm text-sm">
            <Flame fill="currentColor" size={16} />
            <span>{user.streak || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[#FBBF24] bg-[#FFFBEB] px-3 py-1.5 rounded-full shadow-sm text-sm">
            <Gem fill="currentColor" size={16} />
            <span>{user.xp || 0}</span>
          </div>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center mb-6">
            <Target size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">No Courses Yet</h2>
            <p className="text-sm text-slate-500 mb-6">Enter a course code given by your mentor to start learning.</p>
            
            <form onSubmit={handleEnroll} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Course Code (e.g. X7B9A)" 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-bold outline-none focus:border-[#6C4CF1] uppercase"
                maxLength={6}
                required
              />
              <button 
                type="submit" 
                disabled={enrolling}
                className="bg-[#6C4CF1] text-white py-3 rounded-xl font-bold hover:bg-[#5534d1] flex justify-center"
              >
                {enrolling ? <Loader2 className="animate-spin" size={20} /> : 'Join Course'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* Main Action Banner */}
          <div className="relative overflow-hidden mb-8 border-none bg-gradient-to-br from-[#6C4CF1] to-[#5534d1] text-white p-6 shadow-md rounded-2xl">
            <div className="absolute top-[-20px] right-[-20px] opacity-10">
              <Target size={120} />
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block backdrop-blur-sm">
              {enrolledCourses[0]?.title}
            </span>
            <h2 className="text-2xl font-bold mb-1">New Words Available!</h2>
            <p className="text-white/80 text-sm mb-6 font-medium">Practice your recent vocabulary.</p>
            
            <Link href="/learn" className="inline-flex items-center justify-center bg-white text-[#6C4CF1] font-bold hover:bg-slate-50 w-full rounded-xl py-3 shadow-sm transition-transform active:scale-[0.98]">
              START LEARNING
            </Link>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Vocabulary (Realtime)</h3>
          </div>
          
          <div className="space-y-3">
            {recentVocab.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Waiting for your mentor to add words...</p>
            ) : (
              recentVocab.map((v, i) => (
                <div key={v.id || i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFFBEB] text-[#FBBF24] flex items-center justify-center font-bold text-sm">
                      {v.german_word.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{v.german_word}</h4>
                      <p className="text-sm text-slate-500 font-medium">{v.translation}</p>
                    </div>
                  </div>
                  <div className="bg-[#F0FDF4] text-[#10B981] text-xs font-bold px-2 py-1 rounded">
                    NEW
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
