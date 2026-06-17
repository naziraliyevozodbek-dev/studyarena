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
    <nav className="saas-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/mentor' && pathname.startsWith(item.href));
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`saas-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
