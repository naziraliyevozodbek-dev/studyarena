'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Target, Loader2, BookOpen, CheckSquare, Flame, AlertTriangle, Bell, X, Book } from 'lucide-react';
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

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
      fetchNotifications();

      // Poll notifications every 10 seconds for pseudo-realtime
      const notifInterval = setInterval(() => {
        fetchNotifications();
      }, 10000);

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
        clearInterval(notifInterval);
      };
    }
  }, [user, token]);

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

  const fetchNotifications = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/student/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0 || !token) return;
    try {
      await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    markNotificationsAsRead();
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in bg-bg-base">
          {/* True Fullscreen Modal */}
          <div className="relative w-full h-full flex flex-col z-10">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-bg-base/90 backdrop-blur-md z-20">
              <h2 className="text-xl font-bold text-text-main">Bildirishnomalar</h2>
              <button onClick={handleCloseNotifications} className="p-2 bg-bg-secondary rounded-full text-text-secondary hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                  <Bell size={48} className="mb-4 opacity-20" />
                  <p>Hozircha bildirishnomalar yo'q</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <Card key={notification.id} padding="md" className={`flex gap-3 items-start ${!notification.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
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
                {activityDays.map((day, idx) => (
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

          {/* Action Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
             <Link href="/learn">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3">
                   <BookOpen size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Lug'at</h3>
                 <p className="text-xs text-text-secondary">{recentVocab.length} ta yangi so'z</p>
               </Card>
             </Link>
             <Link href="/tasks">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-success-light text-success flex items-center justify-center mb-3">
                   <CheckSquare size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Vazifalar</h3>
                 <p className="text-xs text-text-secondary">{pendingTasksCount} ta vazifa</p>
               </Card>
             </Link>
             <Link href="/challenges">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
                   <Target size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Test va Challenge</h3>
                 <p className="text-xs text-text-secondary">XP ishlash</p>
               </Card>
             </Link>
             <Link href="/learn?category=starred">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-3">
                   <Flame size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Saqlangan so'zlar</h3>
                 <p className="text-xs text-text-secondary">Yod olinganlar</p>
               </Card>
             </Link>
             <Link href="/resources">
               <Card interactive padding="md">
                 <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                   <Book size={20} />
                 </div>
                 <h3 className="font-semibold text-text-main mb-1">Resurslar</h3>
                 <p className="text-xs text-text-secondary">Darsliklar va qoidalar</p>
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
