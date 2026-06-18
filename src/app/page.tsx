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

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('course_members')
        .select(`
          course_id,
          courses (
            id,
            title,
            course_code
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      const courses = data?.map(d => d.courses).filter(Boolean) || [];
      setEnrolledCourses(courses);
      
      if (courses.length > 0) {
        fetchRecentVocab(courses[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchRecentVocab = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('vocabularies')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      setRecentVocab(data || []);
    } catch (error) {
      console.error('Error fetching vocab:', error);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseCode.trim()) return;

    setEnrolling(true);
    try {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('course_code', courseCode.trim().toUpperCase())
        .single();

      if (courseError || !course) {
        alert('Course not found. Please check the code.');
        throw new Error('Course not found');
      }

      const { error: enrollError } = await supabase
        .from('course_members')
        .insert([{
          course_id: course.id,
          user_id: user.id
        }]);

      if (enrollError) {
        if (enrollError.code === '23505') {
          alert('You are already enrolled in this course.');
        } else {
          throw enrollError;
        }
      } else {
        alert('Successfully joined course!');
        setCourseCode('');
        fetchEnrolledCourses();
      }
    } catch (error: any) {
      console.error('Enrollment error:', error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-8 pt-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border">
            {user.avatar_url ? (
               <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-bg-secondary text-text-secondary flex items-center justify-center font-bold text-lg">
                 {user.full_name.charAt(0)}
               </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-text-main">{user.full_name}</h1>
            <p className="text-sm font-medium text-text-tertiary">Student</p>
          </div>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="px-4">
          <Card padding="lg" className="text-center mb-6">
            <Target size={32} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-main mb-1">No Courses</h2>
            <p className="text-text-secondary mb-6 text-sm">Join a course using the code provided by your mentor.</p>
            
            <form onSubmit={handleEnroll} className="flex flex-col gap-3">
              <Input
                type="text" 
                placeholder="Course Code" 
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="text-center text-lg tracking-widest font-semibold uppercase placeholder:normal-case"
                maxLength={6}
                required
              />
              <Button type="submit" disabled={enrolling} fullWidth>
                {enrolling ? <Loader2 className="animate-spin" size={20} /> : 'Join Course'}
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        <div className="px-4">
          {/* iOS Style Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Card padding="md" className="flex flex-col items-center justify-center text-center">
              <span className="text-text-tertiary text-xs font-medium mb-1">XP</span>
              <span className="text-xl font-semibold text-primary">{user.xp || 0}</span>
            </Card>
            <Card padding="md" className="flex flex-col items-center justify-center text-center">
              <span className="text-text-tertiary text-xs font-medium mb-1">Streak</span>
              <span className="text-xl font-semibold text-success">{user.streak || 0}</span>
            </Card>
            <Card padding="md" className="flex flex-col items-center justify-center text-center">
              <span className="text-text-tertiary text-xs font-medium mb-1">Level</span>
              <span className="text-xl font-semibold text-text-main">1</span>
            </Card>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
             <Link href="/learn">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3">
                   <BookOpen size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Vocabulary</h3>
                 <p className="text-xs text-text-secondary">{recentVocab.length} words to practice</p>
               </Card>
             </Link>
             <Link href="/tasks">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-success-light text-success flex items-center justify-center mb-3">
                   <CheckSquare size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Homework</h3>
                 <p className="text-xs text-text-secondary">0 pending tasks</p>
               </Card>
             </Link>
          </div>

          {/* Recent Vocabulary Section */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-semibold text-text-main tracking-tight">Recent Words</h3>
            <span className="text-xs font-medium text-text-tertiary">{enrolledCourses[0]?.title}</span>
          </div>
          
          <Card padding="none">
            {recentVocab.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-text-secondary">No words added yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentVocab.slice(0, 5).map((v, i) => (
                  <div key={v.id || i} className="p-4 flex items-center justify-between bg-bg-card">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-main text-base">{v.german_word}</span>
                      <span className="text-sm text-text-secondary">{v.translation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
