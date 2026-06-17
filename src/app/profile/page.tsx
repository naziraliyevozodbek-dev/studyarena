'use client';

import { useAuth } from '@/context/AuthContext';
import { Settings, LogOut, Medal, Flame, Star, Zap } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const achievements = [
    { icon: Flame, name: 'On Fire', desc: '3 Day Streak', active: user.streak >= 3 },
    { icon: Zap, name: 'Fast Learner', desc: 'Finished Unit 1', active: true },
    { icon: Star, name: 'Perfect Score', desc: '10/10 on Homework', active: false },
  ];

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 m-0">Profile</h1>
        <button className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
          <Settings size={20} />
        </button>
      </div>

      {/* User Info */}
      <div className="flex flex-col items-center mb-8 bg-white p-6 rounded-[28px] shadow-sm border border-slate-100">
        <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 overflow-hidden shadow-inner border-4 border-white">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#6C4CF1] to-[#8b71f3] flex items-center justify-center text-white text-3xl font-black">
              {user.full_name.charAt(0)}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.full_name}</h2>
        <p className="text-sm text-slate-500 font-medium">@{user.username}</p>
        <span className="bg-[#ece9fe] text-[#6C4CF1] px-3 py-1 rounded-full text-xs font-bold mt-3 uppercase tracking-wider">
          {user.role}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card m-0 flex items-center gap-4 border-none shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] flex items-center justify-center shrink-0">
            <Flame size={24} className="text-[#F59E0B]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{user.streak}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Streak</div>
          </div>
        </div>
        
        <div className="card m-0 flex items-center gap-4 border-none shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-[#ece9fe] flex items-center justify-center shrink-0">
            <Zap size={24} className="text-[#6C4CF1]" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{user.xp}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total XP</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Badges</h3>
        <span className="text-sm font-semibold text-[#6C4CF1]">See All</span>
      </div>

      <div className="space-y-3 mb-8">
        {achievements.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div key={idx} className={`card m-0 flex items-center gap-4 border-none shadow-sm p-4 ${badge.active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${badge.active ? 'bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-[15px] mb-1">{badge.name}</h4>
                <p className="text-xs font-medium text-slate-500">{badge.desc}</p>
              </div>
              {badge.active && <div className="text-[#10B981]"><Medal size={20} /></div>}
            </div>
          );
        })}
      </div>

      <button className="btn btn-outline border-none bg-red-50 text-red-500 hover:bg-red-100" onClick={() => window.location.reload()}>
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  );
}
