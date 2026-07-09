'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Target, Loader2, BookOpen, CheckSquare, Flame, AlertTriangle, Bell, X, Book, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useNotifications } from '@/hooks/useNotifications';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

export default function Home() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [courseCode, setCourseCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Redirect Mentors
  useEffect(() => {
    if (user?.role === 'mentor') {
      router.push('/mentor');
    }
  }, [user, router]);

  const shouldFetch = user?.id && user.role !== 'mentor' && token;

  // SWR Hooks for Data Fetching
  const { data: coursesData, isLoading: fetchingCourses, mutate: mutateCourses } = useSWR(
    shouldFetch ? '/api/student/courses' : null,
    (url: string) => fetcher(url, token!),
    { revalidateOnFocus: true }
  );
  const enrolledCourses = coursesData?.courses || [];

  const { data: tasksData } = useSWR(
    (shouldFetch && enrolledCourses.length > 0) ? '/api/student/tasks' : null,
    (url: string) => fetcher(url, token!)
  );
  const pendingTasksCount = (tasksData?.tasks || []).filter((t: any) => !t.submission || t.submission.status === 'rejected').length;

  const { data: weakWordsData } = useSWR(
    (shouldFetch && enrolledCourses.length > 0) ? '/api/student/learn/weak' : null,
    (url: string) => fetcher(url, token!)
  );
  const weakWords = weakWordsData?.vocabularies || [];

  const { data: activityData } = useSWR(
    (shouldFetch && enrolledCourses.length > 0) ? '/api/student/activity' : null,
    (url: string) => fetcher(url, token!)
  );
  const activityDays = activityData?.activityDays || [];

  const [realtimeVocab, setRealtimeVocab] = useState<any[]>([]);
  const { data: vocabData } = useSWR(
    (shouldFetch && enrolledCourses.length > 0) ? `/api/student/vocabularies?courseId=${enrolledCourses[0].id}` : null,
    (url: string) => fetcher(url, token!)
  );
  
  // Combine SWR vocab with realtime updates
  const recentVocab = realtimeVocab.length > 0 
    ? [...realtimeVocab, ...(vocabData?.vocabularies || [])].slice(0, 5) 
    : (vocabData?.vocabularies || []).slice(0, 5);

  // 1. Onboarding check
  useEffect(() => {
    if (shouldFetch && !fetchingCourses) {
      if (!localStorage.getItem('studyarena_onboarded') && enrolledCourses.length === 0) {
        router.push('/onboarding');
      }
    }
  }, [shouldFetch, fetchingCourses, enrolledCourses.length, router]);

  // 2. Realtime subscription
  useEffect(() => {
    if (shouldFetch) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'vocabularies' },
          (payload) => {
            setRealtimeVocab((prev) => [payload.new, ...prev].slice(0, 5));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [shouldFetch, supabase]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    markAsRead();
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleNotificationClick = (notification: any) => {
    handleCloseNotifications();
    if (notification.type === 'homework') {
      router.push('/tasks');
    } else if (notification.type === 'resource') {
      router.push('/resources');
    } else if (notification.type === 'challenge') {
      router.push('/challenges');
    } else if (notification.type === 'vocabulary') {
      router.push('/learn');
    }
  };

  const unreadHomework = notifications.some((n: any) => !n.is_read && n.type === 'homework');
  const unreadResource = notifications.some((n: any) => !n.is_read && n.type === 'resource');
  const unreadChallenge = notifications.some((n: any) => !n.is_read && n.type === 'challenge');
  const unreadVocab = notifications.some((n: any) => !n.is_read && n.type === 'vocabulary');

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
      mutateCourses();
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
      mutateCourses();
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
              <Image src={user.avatar_url} width={64} height={64} alt="Avatar" className="w-full h-full object-cover" />
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
        
        {/* Notification Bell */}
        <button 
          onClick={handleOpenNotifications}
          className="relative p-2 rounded-full bg-bg-card border border-border text-text-secondary hover:text-text-main transition-colors shadow-sm"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-base" />
          )}
        </button>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-base animate-fade-in">
          {/* True Fullscreen Modal */}
          <div className="w-full h-full flex flex-col">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-20 shrink-0">
              <h2 className="text-xl font-bold text-text-main">Bildirishnomalar</h2>
              <button onClick={handleCloseNotifications} className="p-2 bg-bg-secondary rounded-full text-text-secondary hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-safe">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <Bell size={48} className="mb-4 opacity-20" />
                  <p>Hozircha bildirishnomalar yo'q</p>
                </div>
              ) : (
                notifications.map((notification: any) => (
                  <Card 
                    key={notification.id} 
                    padding="md" 
                    className={`flex gap-3 items-start cursor-pointer hover:bg-bg-secondary/50 transition-colors ${!notification.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main mb-1">{notification.title}</h4>
                      <p className="text-xs text-text-secondary leading-relaxed">{notification.message}</p>
                      <span className="text-[10px] text-text-tertiary mt-2 block">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-3 gap-3 mb-2">
            <Card padding="md" className="flex flex-col items-center justify-center text-center col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex flex-col w-full items-center justify-center gap-1">
                <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Level {user.level || 1}</span>
                <span className="text-text-main text-2xl font-black">{user.xp || 0} <span className="text-sm font-bold text-primary">XP</span></span>
              </div>
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
                {activityDays.map((day: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">{day.day}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${day.active ? 'bg-success text-white shadow-sm' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'}`}>
                      {day.active ? '✓' : '❄️'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
             <Link href="/learn" className="block relative">
               {unreadVocab && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-card z-10" />}
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3">
                   <BookOpen size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Lug'at</h3>
                 <p className="text-xs text-text-secondary">Yangi so'zlar</p>
               </Card>
             </Link>
             <Link href="/tasks" className="block relative">
               {unreadHomework && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-card z-10" />}
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-success-light text-success flex items-center justify-center mb-3 relative">
                   <CheckSquare size={20} />
                   {pendingTasksCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                       {pendingTasksCount}
                     </span>
                   )}
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Vazifalar</h3>
                 <p className="text-xs text-text-secondary">Uy vazifalari</p>
               </Card>
             </Link>
             <Link href="/challenges" className="block relative">
               {unreadChallenge && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-card z-10" />}
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                   <Target size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Challenge</h3>
                 <p className="text-xs text-text-secondary">XP ishlash</p>
               </Card>
             </Link>
             <Link href="/resources" className="block relative">
               {unreadResource && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-card z-10" />}
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                   <Book size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Resurslar</h3>
                 <p className="text-xs text-text-secondary">Qoidalar</p>
               </Card>
             </Link>
             <Link href="/learn?category=starred" className="block relative col-span-2">
               <Card interactive padding="md" className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                   <Star size={20} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-text-main mb-0.5">Saqlangan so'zlar</h3>
                   <p className="text-xs text-text-secondary">Yod olinganlar</p>
                 </div>
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
                {recentVocab.slice(0, 5).map((v: any, i: number) => (
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
                {enrolledCourses.map((c: any) => (
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
