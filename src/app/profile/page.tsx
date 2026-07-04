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
    { id: 'streak_3', icon: Flame, name: 'On Fire', desc: '3 kunlik Streak (davomiylik)' },
    { id: 'xp_100', icon: Zap, name: 'Tez o\'rganuvchi', desc: '100 jami XP yig\'ish' },
    { id: 'xp_1000', icon: Star, name: 'XP Master', desc: '1000 jami XP yig\'ish' },
  ];

  const handleDownloadBadge = async () => {
    if (!selectedBadge) return;
    setIsGenerating(true);
    try {
      const isDark = theme === 'dark';
      const W = 560;
      const H = 560;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      if (isDark) {
        grad.addColorStop(0, '#1a2a4a');
        grad.addColorStop(1, '#1E2028');
      } else {
        grad.addColorStop(0, '#e8f0fe');
        grad.addColorStop(1, '#FFFFFF');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Icon circle
      const cx = W / 2;
      const iconY = 160;
      const iconR = 60;
      ctx.beginPath();
      ctx.arc(cx, iconY, iconR, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#1E2028' : '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Icon emoji
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const iconMap: Record<string, string> = { 'streak_3': '🔥', 'xp_100': '⚡', 'xp_1000': '⭐' };
      ctx.fillText(iconMap[selectedBadge.id] || '🏆', cx, iconY);

      // Badge name
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#111827';
      ctx.fillText(selectedBadge.name, cx, 280);

      // Badge description
      ctx.font = '500 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = isDark ? '#A1A1AA' : '#6B7280';
      ctx.fillText(selectedBadge.desc, cx, 330);

      // StudyArena pill
      const pillText = 'STUDYARENA';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
      const pillW = ctx.measureText(pillText).width + 40;
      const pillH = 32;
      const pillX = cx - pillW / 2;
      const pillY = 380;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 16);
      ctx.fillStyle = isDark ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)';
      ctx.fill();
      ctx.fillStyle = isDark ? '#0A84FF' : '#007AFF';
      ctx.fillText(pillText, cx, pillY + pillH / 2 + 1);

      // Watermark
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = isDark ? '#555' : '#bbb';
      ctx.fillText('study-arena.vercel.app', cx, H - 30);

      setGeneratedImage(canvas.toDataURL('image/png'));
    } catch (err: any) {
      console.error('Canvas draw error:', err);
      alert('Rasm yaratishda xatolik: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
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
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedBadge(achievement);
                        setGeneratedImage(null);
                      }
                    }}
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

      <Button variant="outline" className="w-full border-none bg-error/10 text-error hover:bg-error hover:text-white transition-colors" onClick={() => window.location.reload()}>
        <LogOut size={20} /> Sign Out
      </Button>
      {/* Badge Modal - Portal to body */}
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
              width: 280, borderRadius: 24, overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
              backgroundColor: theme === 'dark' ? '#1E2028' : '#FFFFFF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {generatedImage ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <img 
                  src={generatedImage} 
                  alt="Badge" 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{ padding: 14, textAlign: 'center', backgroundColor: theme === 'dark' ? '#1E2028' : '#FFFFFF' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#007AFF', margin: 0 }}>
                    📥 Rasmni saqlash uchun ustiga uzoq bosing
                  </p>
                  <button 
                    onClick={closeBadgeModal}
                    style={{ marginTop: 12, padding: '10px 24px', borderRadius: 12, border: 'none', backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0', color: theme === 'dark' ? '#fff' : '#333', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  padding: '40px 24px 32px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  background: theme === 'dark' 
                    ? 'linear-gradient(180deg, #1a2a4a 0%, #1E2028 100%)' 
                    : 'linear-gradient(180deg, #e8f0fe 0%, #FFFFFF 100%)'
                }}>
                  <div style={{ 
                    width: 100, height: 100, borderRadius: 24, 
                    backgroundColor: theme === 'dark' ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    marginBottom: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    border: `4px solid ${theme === 'dark' ? '#1E2028' : '#FFFFFF'}`
                  }}>
                    <selectedBadge.icon size={48} color={theme === 'dark' ? '#0A84FF' : '#007AFF'} />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: theme === 'dark' ? '#FFFFFF' : '#111827', margin: '0 0 6px' }}>
                    {selectedBadge.name}
                  </h2>
                  <p style={{ fontSize: 13, color: theme === 'dark' ? '#A1A1AA' : '#6B7280', margin: 0 }}>
                    {selectedBadge.desc}
                  </p>
                  <div style={{ 
                    marginTop: 16, padding: '4px 12px', borderRadius: 999, 
                    backgroundColor: theme === 'dark' ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)', 
                    color: theme === 'dark' ? '#0A84FF' : '#007AFF',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em'
                  }}>
                    STUDYARENA
                  </div>
                </div>
                
                <div style={{ padding: 16, borderTop: `1px solid ${theme === 'dark' ? '#272A35' : '#E5E7EB'}`, backgroundColor: theme === 'dark' ? '#1E2028' : '#FFFFFF' }}>
                  <button
                    onClick={handleDownloadBadge}
                    disabled={isGenerating}
                    style={{ 
                      width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', 
                      backgroundColor: '#007AFF', color: '#FFFFFF', fontWeight: 700, fontSize: 15, 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: isGenerating ? 0.6 : 1
                    }}
                  >
                    <Download size={20} />
                    {isGenerating ? 'Yaratilmoqda...' : 'Rasm qilib saqlash'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
