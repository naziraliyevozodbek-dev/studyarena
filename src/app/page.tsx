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
      <div className="flex items-center justify-between mb-8 pt-4 px-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] shadow-[var(--shadow-glow)]">
            <div className="w-full h-full rounded-full bg-[var(--color-bg-base)] overflow-hidden">
              {user.avatar_url ? (
                 <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white">
                   {user.full_name.charAt(0)}
                 </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider uppercase">Welcome back</h2>
            <h1 className="text-xl font-bold text-white tracking-tight">{user.full_name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white">
            <Flame className="text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" fill="currentColor" size={16} />
            <span className="font-bold text-sm">{user.streak || 0}</span>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white">
            <Gem className="text-[#38BDF8] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" fill="currentColor" size={16} />
            <span className="font-bold text-sm">{user.xp || 0}</span>
          </div>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="px-4">
          <div className="glass-panel rounded-3xl p-8 text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-20 blur-xl"></div>
              <Target size={40} className="text-[var(--color-primary)] relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">No Courses Yet</h2>
            <p className="text-[var(--color-text-sub)] mb-8 text-sm">Enter the secret course code given by your mentor to unlock your learning journey.</p>
            
            <form onSubmit={handleEnroll} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Course Code (e.g. X7B9A)" 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="bg-black/20 border border-[var(--color-border)] rounded-2xl px-4 py-4 text-center text-xl tracking-[0.2em] font-bold outline-none focus:border-[var(--color-primary)] text-white uppercase transition-colors"
                maxLength={6}
                required
              />
              <button 
                type="submit" 
                disabled={enrolling}
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity flex justify-center items-center shadow-[var(--shadow-glow)] active:scale-[0.98]"
              >
                {enrolling ? <Loader2 className="animate-spin" size={24} /> : 'Unlock Course'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* Main Action Banner */}
          <div className="relative overflow-hidden mb-8 rounded-3xl p-6 shadow-[var(--shadow-md)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-90 z-0"></div>
            <div className="absolute top-[-20px] right-[-20px] opacity-20 z-0 mix-blend-overlay">
              <Target size={150} />
            </div>
            <div className="relative z-10">
              <span className="glass-panel text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block border-white/20">
                {enrolledCourses[0]?.title}
              </span>
              <h2 className="text-3xl font-extrabold mb-1 text-white tracking-tight">Daily Quest!</h2>
              <p className="text-white/90 text-sm mb-6 font-medium">Practice your new vocabulary to earn XP.</p>
              
              <Link href="/learn" className="inline-flex items-center justify-center bg-white text-[var(--color-primary-dark)] font-bold w-full rounded-2xl py-4 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform text-lg">
                START LEARNING
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Live Vocabulary</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)]"></span>
              </span>
              <span className="text-[10px] font-bold text-[var(--color-success)] uppercase tracking-wider">Syncing</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentVocab.length === 0 ? (
              <div className="glass-panel rounded-2xl p-6 text-center">
                <p className="text-sm text-[var(--color-text-sub)]">Waiting for your mentor to add words...</p>
              </div>
            ) : (
              recentVocab.map((v, i) => (
                <div key={v.id || i} className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38BDF8]/20 to-[#7C3AED]/20 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center font-bold text-lg">
                      {v.german_word.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg leading-tight mb-0.5">{v.german_word}</h4>
                      <p className="text-sm text-[var(--color-text-muted)] font-medium">{v.translation}</p>
                    </div>
                  </div>
                  <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider">
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
