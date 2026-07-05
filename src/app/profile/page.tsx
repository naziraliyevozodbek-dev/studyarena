'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Moon, Sun, User, Loader2, Award, Zap, Flame, Star, X, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import useSWR from 'swr';

const fetcher = async (url: string, token: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

export default function ProfilePage() {
  const { user, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldFetch = token && user?.role !== 'mentor';

  const { data: badgesData } = useSWR(
    shouldFetch ? '/api/student/badges' : null,
    (url: string) => fetcher(url, token!),
    { revalidateOnFocus: true }
  );

  const unlockedBadges = (badgesData?.badges || []).map((b: any) => b.badge_type);

  if (!user) return null;

  const achievements = [
    { id: 'streak_3', icon: Flame, name: 'On Fire', desc: '3 kunlik Streak (davomiylik)', color: 'text-orange-500 bg-orange-100 dark:bg-orange-500/10 border-orange-500/20', hex: '#f97316' },
    { id: 'streak_7', icon: Flame, name: 'Haftalik Qahramon', desc: '7 kunlik uzluksiz kiritish', color: 'text-red-500 bg-red-100 dark:bg-red-500/10 border-red-500/20', hex: '#ef4444' },
    { id: 'streak_30', icon: Flame, name: 'Oylik Chempion', desc: '30 kunlik uzluksiz kiritish', color: 'text-purple-500 bg-purple-100 dark:bg-purple-500/10 border-purple-500/20', hex: '#a855f7' },
    { id: 'xp_100', icon: Zap, name: 'Tez o\'rganuvchi', desc: '100 jami XP yig\'ish', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-500/20', hex: '#eab308' },
    { id: 'xp_500', icon: Zap, name: 'O\'sib borayotgan yulduz', desc: '500 jami XP yig\'ish', color: 'text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 border-yellow-400/20', hex: '#facc15' },
    { id: 'xp_1000', icon: Star, name: 'XP Master', desc: '1000 jami XP yig\'ish', color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/10 border-blue-500/20', hex: '#3b82f6' },
    { id: 'xp_5000', icon: Star, name: 'XP Əfsanasi', desc: '5000 jami XP yig\'ish', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-500/10 border-indigo-500/20', hex: '#6366f1' },
    { id: 'vocab_50', icon: Award, name: 'So\'z ustasi', desc: '50 ta so\'z yodlash', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-500/20', hex: '#10b981' },
    { id: 'vocab_200', icon: Award, name: 'Lug\'at qiroli', desc: '200 ta so\'z yodlash', color: 'text-teal-500 bg-teal-100 dark:bg-teal-500/10 border-teal-500/20', hex: '#14b8a6' },
    { id: 'challenge_winner', icon: Award, name: 'Chempion', desc: 'Musobaqada g\'olib bo\'lish', color: 'text-rose-500 bg-rose-100 dark:bg-rose-500/10 border-rose-500/20', hex: '#f43f5e' },
  ];

  const handlePreviewBadge = (badge: any) => {
    setSelectedBadge(badge);
  };

  const closeBadgeModal = () => {
    setSelectedBadge(null);
    setGeneratedImage(null);
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
            <Image src={user.avatar_url} width={96} height={96} alt="Avatar" className="w-full h-full object-cover" />
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
                <span className="text-xs text-text-tertiary">{(user.xp || 0) % 10000} / 10000 XP</span>
              </div>
              <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden z-10">
                <div className="h-full bg-primary transition-all" style={{ width: `${((user.xp || 0) % 10000) / 100}%` }}></div>
              </div>
            </Card>
          </div>

          {/* Badges Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-text-main tracking-tight">Olingan nishonlar</h2>
              <button 
                onClick={() => setShowAllBadges(true)}
                className="text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                Barchasi ({unlockedBadges.length}/{achievements.length})
              </button>
            </div>
            <div className="grid gap-3">
              {[...achievements]
                .sort((a, b) => {
                  const aUnl = unlockedBadges.includes(a.id);
                  const bUnl = unlockedBadges.includes(b.id);
                  if (aUnl && !bUnl) return -1;
                  if (!aUnl && bUnl) return 1;
                  return 0;
                })
                .slice(0, 3)
                .map((achievement) => {
                  const isUnlocked = unlockedBadges.includes(achievement.id);
                  const Icon = achievement.icon;
                  
                  return (
                    <Card 
                      key={achievement.id} 
                      padding="md" 
                      className={`flex items-center gap-4 transition-all ${isUnlocked ? 'border-primary/30 shadow-md cursor-pointer hover:scale-[1.02]' : 'opacity-60 grayscale cursor-not-allowed border-transparent'}`}
                      onClick={() => {
                        if (isUnlocked) {
                          handlePreviewBadge(achievement);
                        }
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${isUnlocked ? achievement.color : 'bg-bg-secondary text-text-tertiary border-border'}`}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-base mb-1 ${isUnlocked ? 'text-primary' : 'text-text-main'}`}>{achievement.name}</h3>
                        <p className="text-sm text-text-secondary leading-tight">{achievement.desc}</p>
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

      <Button variant="outline" className="w-full border-none bg-error/10 text-error hover:bg-error hover:text-white transition-colors" onClick={() => window.location.reload()}>
        <LogOut size={20} /> Sign Out
      </Button>      {/* Badge Modal - Portal to body */}
      {selectedBadge && typeof document !== 'undefined' && createPortal(
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            backgroundColor: 'rgba(0,0,0,0.8)', margin: 0, padding: 0 
          }}
          onClick={closeBadgeModal}
        >
          <div 
            style={{ 
              width: '90%', maxWidth: 320, borderRadius: 32, overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
              background: theme === 'dark' 
                ? 'linear-gradient(180deg, #1E2028 0%, #15171E 100%)' 
                : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-in zoom-in-95 duration-300 border border-white/10"
          >
            <button 
              onClick={closeBadgeModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-text-secondary hover:text-text-main transition-colors z-10"
            >
              <X size={18} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                padding: '48px 24px 40px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                position: 'relative', overflow: 'hidden'
              }}>
                <div className="absolute inset-0 bg-primary/5 opacity-50"></div>
                
                <div className={`w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6 relative z-10 border-4 ${theme === 'dark' ? 'border-[#1E2028]' : 'border-white'} shadow-xl ${selectedBadge.color}`}>
                  <selectedBadge.icon size={56} color={selectedBadge.hex} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: theme === 'dark' ? '#FFFFFF' : '#111827', margin: '0 0 8px', position: 'relative', zIndex: 1 }}>
                  {selectedBadge.name}
                </h2>
                <p style={{ fontSize: 15, color: theme === 'dark' ? '#A1A1AA' : '#6B7280', margin: 0, fontWeight: 500, position: 'relative', zIndex: 1 }}>
                  {selectedBadge.desc}
                </p>
                
                <div style={{ 
                  marginTop: 32, padding: '6px 16px', borderRadius: 999, 
                  backgroundColor: theme === 'dark' ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.15)', 
                  color: theme === 'dark' ? '#4da3ff' : '#007AFF',
                  fontSize: 12, fontWeight: 900, letterSpacing: '0.15em',
                  position: 'relative', zIndex: 1
                }}>
                  STUDYARENA
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* All Badges Modal */}
      {showAllBadges && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9998] flex flex-col animate-in fade-in duration-200"
          style={{ backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F9FAFB' }}
        >
          <div className="p-4 flex items-center justify-between bg-white dark:bg-bg-card border-b border-border shadow-sm sticky top-0 z-10">
            <h2 className="text-xl font-bold text-text-main tracking-tight">Barcha Nishonlar</h2>
            <button 
              onClick={() => setShowAllBadges(false)} 
              className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center hover:bg-bg-tertiary transition-colors text-text-secondary"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid gap-3 pb-safe">
              {[...achievements]
                .sort((a, b) => {
                  const aUnl = unlockedBadges.includes(a.id);
                  const bUnl = unlockedBadges.includes(b.id);
                  if (aUnl && !bUnl) return -1;
                  if (!aUnl && bUnl) return 1;
                  return 0;
                })
                .map((achievement) => {
                  const isUnlocked = unlockedBadges.includes(achievement.id);
                  const Icon = achievement.icon;
                  return (
                    <Card 
                      key={achievement.id} 
                      padding="md" 
                      className={`flex items-center gap-4 transition-all ${isUnlocked ? 'border-primary/30 shadow-md cursor-pointer hover:scale-[1.02]' : 'opacity-60 grayscale cursor-not-allowed'}`}
                      onClick={() => {
                        if (isUnlocked) {
                          handlePreviewBadge(achievement);
                        }
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-tertiary'}`}>
                        <Icon size={28} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-base mb-1 ${isUnlocked ? 'text-primary' : 'text-text-main'}`}>{achievement.name}</h3>
                        <p className="text-sm text-text-secondary leading-tight">{achievement.desc}</p>
                      </div>
                    </Card>
                  );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
