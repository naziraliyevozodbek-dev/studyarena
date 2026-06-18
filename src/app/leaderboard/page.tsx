'use client';

import { useAuth } from '@/context/AuthContext';
import { Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();

  // Dummy leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Alex M.', xp: 2500, isMe: false },
    { rank: 2, name: 'Sarah K.', xp: 2100, isMe: false },
    { rank: 3, name: user?.full_name || 'You', xp: user?.xp || 1850, isMe: true },
    { rank: 4, name: 'John D.', xp: 1700, isMe: false },
    { rank: 5, name: 'Emma W.', xp: 1650, isMe: false },
    { rank: 6, name: 'Lucas R.', xp: 1400, isMe: false },
  ];

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="animate-fade-in pb-8">
      
      {/* Top Controls */}
      <div className="flex bg-bg-secondary rounded-full p-1 mb-8 mt-2 mx-auto w-full max-w-[280px]">
        <button className="flex-1 py-2 rounded-full font-bold text-sm bg-bg-card shadow-sm text-primary">Weekly</button>
        <button className="flex-1 py-2 rounded-full font-bold text-sm text-text-secondary">Monthly</button>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center h-48 mb-10 px-4 gap-2">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-1/3 z-10">
          <div className="w-12 h-12 rounded-full bg-bg-secondary border-2 border-bg-card mb-2 shadow-sm flex items-center justify-center font-bold text-text-secondary">S</div>
          <span className="text-xs font-bold text-text-main truncate w-full text-center">{top3[1]?.name}</span>
          <span className="text-[10px] font-bold text-yellow-500 mb-2">{top3[1]?.xp} XP</span>
          <div className="w-full bg-primary/20 rounded-t-2xl h-24 flex justify-center pt-2 relative">
            <span className="text-2xl font-black text-primary drop-shadow-sm">2</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center w-1/3 z-20 pb-4">
          <Medal className="text-yellow-400 mb-1" size={24} fill="currentColor" />
          <div className="w-16 h-16 rounded-full bg-bg-secondary border-4 border-yellow-400 mb-2 shadow-md flex items-center justify-center font-bold text-text-main text-xl">A</div>
          <span className="text-xs font-bold text-text-main truncate w-full text-center">{top3[0]?.name}</span>
          <span className="text-[10px] font-bold text-yellow-500 mb-2">{top3[0]?.xp} XP</span>
          <div className="w-full bg-primary rounded-t-2xl h-32 flex justify-center pt-3 shadow-lg relative">
            <span className="text-4xl font-black text-white drop-shadow-md">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center w-1/3 z-10">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 border-2 border-bg-card mb-2 shadow-sm flex items-center justify-center font-bold">Y</div>
          <span className="text-xs font-bold text-text-main truncate w-full text-center">{top3[2]?.name}</span>
          <span className="text-[10px] font-bold text-yellow-500 mb-2">{top3[2]?.xp} XP</span>
          <div className="w-full bg-primary/20 rounded-t-2xl h-20 flex justify-center pt-2 relative">
            <span className="text-xl font-black text-primary drop-shadow-sm">3</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-bg-card rounded-[28px] overflow-hidden shadow-sm border border-border">
        {rest.map((student) => (
          <div 
            key={student.rank} 
            className={`flex items-center p-4 border-b border-border last:border-0 hover:bg-bg-secondary transition ${student.isMe ? 'bg-primary/5' : ''}`}
          >
            <div className="w-8 font-bold text-text-tertiary text-center mr-2">
              {student.rank}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center mr-4 text-text-secondary font-bold text-sm">
              {student.name?.charAt(0) || '?'}
            </div>
            
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${student.isMe ? 'text-primary' : 'text-text-main'}`}>
                {student.name}
              </h4>
            </div>
            
            <div className="font-bold text-sm text-yellow-500">
              {student.xp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
