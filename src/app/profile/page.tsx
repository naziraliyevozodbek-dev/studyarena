'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Settings, LogOut, Medal, Flame, Star, Zap, Moon, Sun } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const achievements = [
    { icon: Flame, name: 'On Fire', desc: '3 Day Streak', active: user.streak >= 3 },
    { icon: Zap, name: 'Fast Learner', desc: '100 Total XP', active: user.xp >= 100 },
    { icon: Star, name: 'XP Master', desc: '1000 Total XP', active: user.xp >= 1000 },
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

      {user.role !== 'mentor' && (
        <>
          {/* Stats Grid */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-3">
              <Card padding="lg" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                  <Flame size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-main">{user.streak || 0}</div>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Streak</div>
                </div>
              </Card>
              <Card padding="lg" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-main">{user.xp || 0}</div>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total XP</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-text-main tracking-tight">Badges</h2>
              <button className="text-sm font-semibold text-primary">See All</button>
            </div>
            <div className="grid gap-3">
              <Card padding="md" className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center text-text-tertiary">
                  <Flame size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main text-base mb-1">On Fire</h3>
                  <p className="text-sm text-text-secondary">3 Day Streak</p>
                </div>
              </Card>
              <Card padding="md" className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center text-text-tertiary">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="font-semibold text-text-main text-base mb-1">Fast Learner</h3>
                  <p className="text-sm text-text-secondary">Completed 5 lessons</p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text-main mb-4">Preferences</h3>
        {mounted && (
          <Card 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-secondary transition-colors" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-text-main border border-border">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="font-bold text-text-main">Dark Mode</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-text-tertiary'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </Card>
        )}
      </div>

      <Button variant="outline" className="w-full border-none bg-red-50 text-red-500 hover:bg-red-100" onClick={() => window.location.reload()}>
        <LogOut size={20} /> Sign Out
      </Button>
    </div>
  );
}
