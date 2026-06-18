'use client';

import { useAuth } from '@/context/AuthContext';
import { Settings, LogOut, Medal, Flame, Star, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
        <button className="text-text-secondary hover:text-text-main bg-bg-card p-2 rounded-full shadow-sm">
          <Settings size={20} />
        </button>
      </div>

      {/* User Info */}
      <Card className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-bg-secondary mb-4 overflow-hidden shadow-inner border-4 border-bg-base">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-black">
              {user.full_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-text-main mb-1">{user.full_name}</h2>
        <p className="text-sm text-text-secondary font-medium">@{user.username}</p>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mt-3 uppercase tracking-wider">
          {user.role}
        </span>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
            <Flame size={24} className="text-yellow-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-text-main">{user.streak}</div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide">Streak</div>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl font-black text-text-main">{user.xp}</div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide">Total XP</div>
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-main">Badges</h3>
        <span className="text-sm font-semibold text-primary">See All</span>
      </div>

      <div className="space-y-3 mb-8">
        {achievements.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <Card key={idx} className={`flex items-center gap-4 p-4 ${badge.active ? '' : 'opacity-60'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${badge.active ? 'bg-yellow-500 text-white shadow-md' : 'bg-bg-secondary text-text-tertiary'}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-text-main text-[15px] mb-1">{badge.name}</h4>
                <p className="text-xs font-medium text-text-secondary">{badge.desc}</p>
              </div>
              {badge.active && <div className="text-green-500"><Medal size={20} /></div>}
            </Card>
          );
        })}
      </div>

      <Button variant="outline" className="w-full border-none bg-red-50 text-red-500 hover:bg-red-100" onClick={() => window.location.reload()}>
        <LogOut size={20} /> Sign Out
      </Button>
    </div>
  );
}
