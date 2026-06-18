'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Book, CheckSquare, BarChart, Settings } from 'lucide-react';

export default function MentorNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/mentor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/mentor/courses', label: 'Courses', icon: Book },
    { href: '/mentor/homework', label: 'Homework', icon: CheckSquare },
    { href: '/mentor/analytics', label: 'Analytics', icon: BarChart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-bg-card/80 backdrop-blur-xl border-t border-border shadow-[var(--app-shadow-nav)] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-between items-center w-full max-w-[480px] px-2 h-[68px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/mentor' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex 1 flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
