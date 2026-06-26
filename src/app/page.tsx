'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Target, Loader2, BookOpen, CheckSquare, Flame, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Home() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [courseCode, setCourseCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [recentVocab, setRecentVocab] = useState<any[]>([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [weakWords, setWeakWords] = useState<any[]>([]);
  const [activityDays, setActivityDays] = useState<any[]>([]);

  // Redirect Mentors
  useEffect(() => {
    if (user?.role === 'mentor') {
      router.push('/mentor');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.id && user.role !== 'mentor') {
      fetchEnrolledCourses();
      fetchWeakWords();
      fetchActivity();

      if (!localStorage.getItem('studyarena_onboarded')) {
        // If they have no enrolled courses and not onboarded yet
        // Wait for fetchEnrolledCourses to finish? 
        // We'll just rely on localStorage to keep it simple and fast
        router.push('/onboarding');
      }

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
            setRecentVocab((prev) => [payload.new, ...prev].slice(0, 5));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch('/api/student/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      const courses = data.courses || [];
      setEnrolledCourses(courses);
      
      if (courses.length > 0) {
        fetchRecentVocab(courses[0].id);
        fetchPendingTasksCount();
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setFetchingCourses(false);
    }
  };

  const fetchRecentVocab = async (courseId: string) => {
    try {
      if (!token) return;
      const res = await fetch(`/api/student/vocabularies?courseId=${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setRecentVocab(data.vocabularies || []);
    } catch (error) {
      console.error('Error fetching vocab:', error);
    }
  };

  const fetchPendingTasksCount = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/student/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const tasks = data.tasks || [];
      const pending = tasks.filter((t: any) => !t.submission || t.submission.status === 'rejected');
      setPendingTasksCount(pending.length);
    } catch (error) {
      console.error('Error fetching tasks count:', error);
    }
  };

  const fetchWeakWords = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/student/learn/weak', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setWeakWords(data.vocabularies || []);
    } catch (error) {
      console.error('Error fetching weak words:', error);
    }
  };

  const fetchActivity = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/student/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setActivityDays(data.activityDays || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseCode.trim() || !token) return;

    setEnrolling(true);
    try {
      const res = await fetch('/api/student/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_code: courseCode })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Course not found') {
          toast.error('Bunday kodli kurs topilmadi. Kodni tekshiring.');
        } else if (data.error === 'Already enrolled') {
          toast.error('Siz bu kursga avval qo\'shilgansiz.');
        } else {
          toast.error('Xatolik yuz berdi: ' + data.error);
        }
        return;
      }

      toast.success('Kursga muvaffaqiyatli qo\'shildingiz!');
      setCourseCode('');
      fetchEnrolledCourses();
    } catch (error: any) {
      console.error('Enrollment error:', error.message);
      toast.error('Tarmoq xatosi yuz berdi');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLeaveCourse = async (courseId: string) => {
    if (!confirm("Rostan ham bu kursdan chiqmoqchimisiz? Barcha natijalaringiz o'chib ketadi!")) return;
    try {
      const res = await fetch(`/api/student/leave?courseId=${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to leave');
      toast.success('Kursdan chiqdingiz');
      fetchEnrolledCourses();
    } catch (error) {
      console.error(error);
      toast.error('Xatolik yuz berdi');
    }
  };

  if (!user || user.role === 'mentor') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-8 pt-4">
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

      {fetchingCourses ? (
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
            <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
            <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="h-16 w-full rounded-[var(--radius-card)] mt-4" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
            <Skeleton className="h-28 w-full rounded-[var(--radius-card)]" />
          </div>
        </div>
      ) : enrolledCourses.length === 0 ? (
        <div>
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
        <div>
          {/* iOS Style Metric Cards Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card padding="md" className="flex flex-col items-center justify-center text-center">
              <span className="text-text-tertiary text-xs font-medium mb-1">XP</span>
              <span className="text-xl font-semibold text-primary">{user.xp || 0}</span>
            </Card>
            <Card padding="md" className="flex flex-col items-center justify-center text-center">
              <span className="text-text-tertiary text-xs font-medium mb-1">Level</span>
              <span className="text-xl font-semibold text-text-main">1</span>
            </Card>
            <Card padding="md" className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 border-orange-200 dark:border-orange-500/20">
              <span className="text-orange-600/80 dark:text-orange-500 text-xs font-medium mb-1 flex items-center gap-1"><Flame size={12}/> Streak</span>
              <span className="text-xl font-semibold text-orange-500">{user.streak || 0}</span>
            </Card>
          </div>

          {/* Activity Calendar Widget */}
          {activityDays.length > 0 && (
            <Card padding="md" className="mb-8 overflow-hidden bg-bg-card">
              <div className="flex justify-between w-full">
                {activityDays.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">{day.day}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${day.active ? 'bg-success text-white shadow-sm' : 'bg-bg-secondary text-text-tertiary'}`}>
                      {day.active ? '✓' : '✗'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
                 <p className="text-xs text-text-secondary">{pendingTasksCount} pending tasks</p>
               </Card>
             </Link>
             <Link href="/challenges">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-3">
                   <Target size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Challenges</h3>
                 <p className="text-xs text-text-secondary">Earn extra XP</p>
               </Card>
             </Link>
             <Link href="/resources">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
                   <BookOpen size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Resources</h3>
                 <p className="text-xs text-text-secondary">Files & Links</p>
               </Card>
             </Link>
          </div>

          {/* Weak Words Section */}
          {weakWords.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-semibold text-text-main tracking-tight flex items-center gap-2">
                  <AlertTriangle size={20} className="text-error" /> 
                  Words to Improve
                </h3>
              </div>
              <Card padding="md" className="border-error/20 bg-error/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-text-secondary"><span className="font-bold text-error">{weakWords.length}</span> words need practice.</p>
                </div>
                <Button fullWidth className="bg-error hover:bg-error-hover text-white" onClick={() => router.push('/learn/weak')}>
                  Practice Weak Words
                </Button>
              </Card>
            </div>
          )}

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

          {/* Course Management */}
          <div className="mt-8 flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-text-main tracking-tight px-1">Manage Courses</h3>
            <Card padding="md">
              <form onSubmit={handleEnroll} className="flex flex-col gap-3 mb-4">
                <p className="text-sm text-text-secondary">Join another course</p>
                <div className="flex gap-2">
                  <Input
                    type="text" 
                    placeholder="Course Code" 
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="flex-1 uppercase font-semibold"
                    maxLength={6}
                    required
                  />
                  <Button type="submit" disabled={enrolling}>
                    {enrolling ? <Loader2 className="animate-spin" size={20} /> : 'Join'}
                  </Button>
                </div>
              </form>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-text-secondary mb-3">Your enrolled courses</p>
                {enrolledCourses.map(c => (
                  <div key={c.id} className="flex justify-between items-center bg-bg-secondary p-3 rounded-xl mb-2">
                    <span className="font-semibold text-text-main text-sm">{c.title}</span>
                    <button 
                      onClick={() => handleLeaveCourse(c.id)}
                      className="text-xs font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg active:bg-error/20"
                    >
                      Leave
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
