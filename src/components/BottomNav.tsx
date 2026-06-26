'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, CheckSquare, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;
  if (pathname === '/onboarding') return null;

  const navItems = user.role === 'mentor'
    ? [
        { href: '/mentor', label: 'Dashboard', icon: Home },
        { href: '/mentor/courses', label: 'Courses', icon: BookOpen },
        { href: '/mentor/homework', label: 'Homework', icon: CheckSquare },
        { href: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { href: '/', label: 'Home', icon: Home },
        { href: '/learn', label: 'Learn', icon: BookOpen },
        { href: '/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/leaderboard', label: 'Ranks', icon: Trophy },
        { href: '/profile', label: 'Profile', icon: User },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-bg-card/80 backdrop-blur-xl border-t border-border shadow-[var(--app-shadow-nav)] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-between items-center w-full px-2 h-[68px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex 1 flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


