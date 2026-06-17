'use client';

import { useAuth } from '@/context/AuthContext';
import { Users, UserCheck, CheckCircle, TrendingUp } from 'lucide-react';

export default function MentorDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Students', value: '128', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Students', value: '114', icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'HW Completion', value: '86%', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Avg Weekly XP', value: '1.2k', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const topStudents = [
    { name: 'Alex M.', course: 'German A1', completion: '98%' },
    { name: 'Sarah K.', course: 'German A1', completion: '95%' },
    { name: 'John D.', course: 'German B2', completion: '92%' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="saas-header mb-1">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Here's an overview of your teaching performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="saas-card p-4 m-0 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="saas-card">
        <h2 className="text-base font-bold text-slate-900 mb-4">Top Performing Students</h2>
        <div className="space-y-4">
          {topStudents.map((student, idx) => (
            <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{student.name}</h4>
                  <p className="text-xs text-slate-500">{student.course}</p>
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-600">
                {student.completion}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
