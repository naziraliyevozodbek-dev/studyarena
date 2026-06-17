'use client';

import { useAuth } from '@/context/AuthContext';
import { Flame, Gem, BookOpen, ChevronRight, CheckCircle2, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'mentor') {
      router.push('/mentor');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">

        <div className="animate-bounce-sm text-slate-400 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
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
        <h1 className="text-h1 mb-2 text-slate-800">Welcome!</h1>
        <p className="text-body text-slate-500 mb-6">
          {error ? `Error: ${error}` : 'Please open this app inside Telegram.'}
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Premium Header Profile Bar */}
      <div className="flex items-center justify-between mb-8 pt-2">
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

      {/* Main Action Banner */}
      <div className="card relative overflow-hidden mb-8 border-none bg-gradient-to-br from-[#6C4CF1] to-[#5534d1] text-white p-6 shadow-md">
        <div className="absolute top-[-20px] right-[-20px] opacity-10">
          <Target size={120} />
        </div>
        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block backdrop-blur-sm">Up Next</span>
        <h2 className="text-2xl font-bold mb-1">German Verbs</h2>
        <p className="text-white/80 text-sm mb-6 font-medium">Continue your vocabulary training</p>
        
        <div className="progress-bg mb-6 h-2.5 bg-black/20">
          <div className="progress-fill bg-[#FBBF24]" style={{ width: '40%' }}></div>
        </div>
        
        <Link href="/learn" className="btn bg-white text-[#6C4CF1] hover:bg-slate-50 w-full rounded-2xl shadow-sm border-none">
          CONTINUE LEARNING
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Daily Missions</h3>
        <span className="text-sm font-semibold text-[#6C4CF1]">View all</span>
      </div>
      
      <div className="space-y-4">
        {/* Active Mission */}
        <div className="card flex items-center gap-4 m-0 border-none shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] text-[#FBBF24] flex items-center justify-center shrink-0">
            <Gem size={28} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-[15px] mb-2">Earn 50 XP</h4>
            <div className="flex items-center gap-3">
              <div className="progress-bg h-2 flex-1">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
              <span className="text-xs text-slate-400 font-bold w-12 text-right">30/50</span>
            </div>
          </div>
        </div>

        {/* Completed Mission */}
        <div className="card flex items-center gap-4 m-0 border-none shadow-sm p-4 bg-[#F0FDF4] opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 size={28} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#059669] text-[15px] mb-1">Complete 1 Lesson</h4>
            <p className="text-sm text-[#059669] font-medium">Mission Completed! 🎉</p>
          </div>
        </div>
      </div>

    </div>
  );
}
