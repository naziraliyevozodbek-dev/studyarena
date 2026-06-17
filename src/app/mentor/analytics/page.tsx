'use client';

import { BarChart3, Users, Trophy } from 'lucide-react';

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
        <h1 className="saas-header mb-1">Analytics</h1>
        <p className="text-sm text-slate-500">Performance insights & rankings</p>
      </div>

      <div className="saas-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" /> Activity Over Time
          </h2>
          <select className="text-xs border-slate-200 rounded p-1 outline-none">
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
        
        {/* Placeholder for a chart */}
        <div className="h-40 w-full bg-slate-50 rounded-lg border border-slate-100 flex items-end px-4 gap-2 pt-8">
          <div className="w-1/6 bg-blue-200 rounded-t-sm h-[30%]"></div>
          <div className="w-1/6 bg-blue-300 rounded-t-sm h-[50%]"></div>
          <div className="w-1/6 bg-blue-400 rounded-t-sm h-[80%]"></div>
          <div className="w-1/6 bg-blue-300 rounded-t-sm h-[60%]"></div>
          <div className="w-1/6 bg-blue-500 rounded-t-sm h-[100%]"></div>
          <div className="w-1/6 bg-blue-400 rounded-t-sm h-[90%]"></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-bold uppercase">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
      </div>

      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Trophy size={18} className="text-yellow-500" /> Global Leaderboard
      </h2>
      
      <div className="saas-card p-0 overflow-hidden">
        {leaderboard.map((student, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className={`w-6 text-center font-bold text-sm ${student.rank <= 3 ? 'text-yellow-500' : 'text-slate-400'}`}>
                {student.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                {student.name.charAt(0)}
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{student.name}</h4>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
              {student.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
