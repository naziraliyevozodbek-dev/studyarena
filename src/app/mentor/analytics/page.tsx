'use client';

import { BarChart3, Users, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function MentorAnalytics() {
  const leaderboard = [
    { rank: 1, name: 'Alex M.', xp: 2500 },
    { rank: 2, name: 'Sarah K.', xp: 2100 },
    { rank: 3, name: 'John D.', xp: 1700 },
    { rank: 4, name: 'Emma W.', xp: 1650 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-h1 mb-1">Analytics</h1>
        <p className="text-sm text-text-secondary">Performance insights & rankings</p>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Activity Over Time
          </h2>
          <select className="text-xs border border-border rounded p-1 outline-none bg-bg-base text-text-main">
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
        
        {/* Placeholder for a chart */}
        <div className="h-40 w-full bg-bg-base rounded-lg border border-border flex items-end px-4 gap-2 pt-8">
          <div className="w-1/6 bg-primary/30 rounded-t-sm h-[30%]"></div>
          <div className="w-1/6 bg-primary/40 rounded-t-sm h-[50%]"></div>
          <div className="w-1/6 bg-primary/60 rounded-t-sm h-[80%]"></div>
          <div className="w-1/6 bg-primary/50 rounded-t-sm h-[60%]"></div>
          <div className="w-1/6 bg-primary rounded-t-sm h-[100%]"></div>
          <div className="w-1/6 bg-primary/80 rounded-t-sm h-[90%]"></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-text-tertiary font-bold uppercase">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
      </Card>

      <h2 className="text-base font-bold text-text-main mb-4 flex items-center gap-2">
        <Trophy size={18} className="text-yellow-500" /> Global Leaderboard
      </h2>
      
      <Card className="p-0 overflow-hidden">
        {leaderboard.map((student, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-bg-secondary transition">
            <div className="flex items-center gap-3">
              <span className={`w-6 text-center font-bold text-sm ${student.rank <= 3 ? 'text-yellow-500' : 'text-text-tertiary'}`}>
                {student.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold text-text-secondary">
                {student.name?.charAt(0) || '?'}
              </div>
              <h4 className="text-sm font-semibold text-text-main">{student.name}</h4>
            </div>
            <span className="text-xs font-bold text-text-secondary bg-bg-secondary px-2 py-1 rounded">
              {student.xp} XP
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
