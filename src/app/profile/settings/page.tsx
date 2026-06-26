'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Moon, Sun, Bell, Volume2, Globe, HelpCircle, User as UserIcon, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState(user?.role || 'student');
  
  // Local Settings
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [language, setLanguage] = useState('uz');
  const [dailyGoal, setDailyGoal] = useState('50');

  useEffect(() => {
    // Load local settings
    setDarkMode(document.documentElement.classList.contains('dark'));
    setNotifications(localStorage.getItem('setting_notifications') !== 'false');
    setSoundEffects(localStorage.getItem('setting_sound') !== 'false');
    setLanguage(localStorage.getItem('setting_language') || 'uz');
    setDailyGoal(localStorage.getItem('setting_daily_goal') || '50');
  }, []);

  const handleSaveSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Save local settings
      localStorage.setItem('setting_notifications', notifications.toString());
      localStorage.setItem('setting_sound', soundEffects.toString());
      localStorage.setItem('setting_language', language);
      localStorage.setItem('setting_daily_goal', dailyGoal);
      
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }

      // Save server settings
      if (fullName !== user?.full_name || role !== user?.role) {
        if (role !== user?.role) {
          const confirmRole = window.confirm("Rolingizni o'zgartirmoqchimisiz? Bu ilova interfeysini butunlay o'zgartiradi.");
          if (!confirmRole) {
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/user/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ full_name: fullName, role })
        });
        
        if (!res.ok) throw new Error("Profilni saqlashda xatolik yuz berdi");
        await refreshUser(); // refresh context
      }

      toast.success("Sozlamalar saqlandi!");
      router.push(role === 'mentor' ? '/mentor' : '/profile');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!token) return;
    const confirmReset = window.confirm("Rostdan ham barcha progressni noldan boshlamoqchimisiz? XP va yodlangan so'zlar o'chib ketadi. Bu amalni ortga qaytarib bo'lmaydi!");
    if (!confirmReset) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/user/reset-progress', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Progressni tozalashda xatolik yuz berdi");
      
      toast.success("Progress muvaffaqiyatli tozalandi!");
      await refreshUser();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24 text-text-main">
      <div className="flex items-center justify-between pt-4 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-primary font-semibold hover:opacity-80">
          <ArrowLeft size={20} />
          <span>Orqaga</span>
        </button>
        <h1 className="text-xl font-bold">Sozlamalar</h1>
        <div className="w-20"></div>
      </div>

      <div className="w-full px-4 flex flex-col gap-6">
        
        {/* Profile Settings */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Profil</h2>
          <Card padding="md" className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1 block">To'liq ismingiz</label>
              <div className="flex items-center gap-3 bg-bg-secondary px-3 py-2 rounded-xl">
                <UserIcon size={18} className="text-primary" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-tertiary mb-1 block">Ruxsat (Rol)</label>
              <div className="flex items-center gap-3 bg-bg-secondary p-1 rounded-xl">
                <button 
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${role === 'student' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                >
                  O'quvchi
                </button>
                <button 
                  onClick={() => setRole('mentor')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${role === 'mentor' ? 'bg-primary text-white' : 'text-text-secondary'}`}
                >
                  Mentor
                </button>
              </div>
            </div>
          </Card>
        </section>

        {/* App Settings */}
        <section>
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Ilova</h2>
          <Card padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <span className="font-semibold text-sm">Tungi rejim</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <Bell size={18} />
                </div>
                <span className="font-semibold text-sm">Bildirishnomalar</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                  <Volume2 size={18} />
                </div>
                <span className="font-semibold text-sm">Ovoz effektlari</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={soundEffects} onChange={() => setSoundEffects(!soundEffects)} />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Globe size={18} />
                </div>
                <span className="font-semibold text-sm">Til</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-bg-secondary text-sm font-semibold rounded-lg px-2 py-1 outline-none border-none"
              >
                <option value="uz">O'zbekcha</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </div>
          </Card>
        </section>

        {/* Study Goals */}
        {role === 'student' && (
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Maqsad</h2>
            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Kunlik XP maqsadi</span>
                <span className="text-primary font-bold">{dailyGoal} XP</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                step="10" 
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full accent-primary"
              />
            </Card>
          </section>
        )}

        {/* Data Management */}
        {role === 'student' && (
          <section>
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Ma'lumotlar</h2>
            <Card padding="md" className="border-error/20 bg-error/5">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-sm text-error">Progressni tozalash</span>
                <span className="text-xs text-text-secondary">Yig'ilgan barcha XP va yodlangan so'zlarni noldan boshlash.</span>
                <Button 
                  onClick={handleResetProgress} 
                  variant="outline" 
                  className="mt-2 text-error border-error/50 hover:bg-error/10"
                >
                  <RefreshCcw size={16} className="mr-2"/> Noldan boshlash
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Support */}
        <section>
          <Card padding="none" className="overflow-hidden">
            <a href="https://t.me/naz1raliyev_05" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 hover:bg-bg-secondary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <HelpCircle size={18} />
                </div>
                <span className="font-semibold text-sm">Yordam va Aloqa (@naz1raliyev_05)</span>
              </div>
              <ArrowLeft size={16} className="rotate-135 text-text-tertiary" />
            </a>
          </Card>
        </section>

        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          fullWidth
          className="mt-4 mb-8 py-4 text-lg"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : 'Saqlash'}
        </Button>

      </div>
    </div>
  );
}
