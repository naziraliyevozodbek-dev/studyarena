'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Moon, Sun, User, Loader2, Award, Zap, Flame, Star, X, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toPng } from 'html-to-image';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (token && user?.role !== 'mentor') {
      fetch('/api/student/badges', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.badges) {
          setUnlockedBadges(data.badges.map((b: any) => b.badge_type));
        }
      })
      .catch(console.error);
    }
  }, [token, user]);

  if (!user) return null;

  const achievements = [
    { id: 'streak_3', icon: Flame, name: 'On Fire', desc: '3 kunlik Streak (davomiylik)' },
    { id: 'xp_100', icon: Zap, name: 'Tez o\'rganuvchi', desc: '100 jami XP yig\'ish' },
    { id: 'xp_1000', icon: Star, name: 'XP Master', desc: '1000 jami XP yig\'ish' },
  ];

  const handleDownloadBadge = async () => {
    if (!badgeRef.current || !selectedBadge) return;
    try {
      const dataUrl = await toPng(badgeRef.current, { cacheBust: true, backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7' });
      const link = document.createElement('a');
      link.download = `${selectedBadge.id}-badge.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 m-0">Profile</h1>
        <button onClick={() => router.push('/profile/settings')} className="text-text-secondary hover:text-text-main bg-bg-card p-2 rounded-full shadow-sm">
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
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
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
            {/* Level Card */}
            <Card padding="md" className="relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="z-10 flex w-full justify-between items-center mb-2">
                <span className="text-sm font-semibold text-text-main">Level {user.level || 1}</span>
                <span className="text-xs text-text-tertiary">{(user.xp || 0) % 100} / 100 XP</span>
              </div>
              <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden z-10">
                <div className="h-full bg-primary transition-all" style={{ width: `${(user.xp || 0) % 100}%` }}></div>
              </div>
            </Card>
          </div>

          {/* Badges Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-text-main tracking-tight">Nishonlar</h2>
            </div>
            <div className="grid gap-3">
              {achievements.map((achievement) => {
                const isUnlocked = unlockedBadges.includes(achievement.id);
                const Icon = achievement.icon;
                
                return (
                  <Card 
                    key={achievement.id} 
                    padding="md" 
                    className={`flex items-center gap-4 transition-all ${isUnlocked ? 'border-primary/30 shadow-md cursor-pointer hover:scale-[1.02]' : 'opacity-60 grayscale cursor-not-allowed'}`}
                    onClick={() => isUnlocked && setSelectedBadge(achievement)}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-tertiary'}`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-base mb-1 ${isUnlocked ? 'text-primary' : 'text-text-main'}`}>{achievement.name}</h3>
                      <p className="text-sm text-text-secondary">{achievement.desc}</p>
                    </div>
                  </Card>
                );
              })}
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
              <span className="font-bold text-text-main">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
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
      {/* Badge Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-base w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-slide-up relative">
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div 
              ref={badgeRef} 
              className="p-10 flex flex-col items-center text-center bg-gradient-to-b from-primary/20 to-bg-base"
            >
              <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-lg border-4 border-white dark:border-bg-card">
                <selectedBadge.icon size={64} />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">{selectedBadge.name}</h2>
              <p className="text-text-secondary">{selectedBadge.desc}</p>
              <div className="mt-4 inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                StudyArena
              </div>
            </div>
            
            <div className="p-4 bg-bg-card border-t border-border">
              <Button onClick={handleDownloadBadge} fullWidth className="flex items-center justify-center gap-2">
                <Download size={20} />
                Rasm qilib saqlash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
