'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, CheckSquare, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide nav if user is not loaded
  if (!user) return null;

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="glass-panel pointer-events-auto rounded-full flex justify-between items-center px-2 py-2 w-full max-w-[400px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 relative ${
                isActive ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] rounded-full opacity-100 shadow-[var(--shadow-glow)] scale-100 transition-transform duration-300" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'translate-y-[-2px] transition-transform duration-300' : 'transition-transform duration-300'} />
                <span className={`text-[9px] font-bold tracking-wide transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

