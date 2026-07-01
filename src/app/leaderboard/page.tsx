'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Crown, Loader2 } from 'lucide-react';

type LeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  isMe: boolean;
  avatar?: string;
};

export default function LeaderboardPage() {
  const { user, token } = useAuth();
  const supabase = useSupabase();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'daily'|'monthly'|'all'>('daily');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user || !token) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?filter=${timeFilter}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const mapped = (data.leaderboard || []).map((l: any, index: number) => ({
          rank: index + 1,
          name: l.full_name || `@${l.username}` || 'Unknown',
          xp: l.xp || 0,
          isMe: l.id === user.id,
          avatar: l.avatar_url
        }));
        setLeaderboard(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, token, timeFilter]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Helper to render Avatar
  const renderAvatar = (entry: LeaderboardEntry | undefined, sizeClass: string) => {
    if (!entry) return <div className={`${sizeClass} rounded-full bg-bg-secondary border-4 border-bg-base flex items-center justify-center font-bold text-text-tertiary shadow-sm`}>?</div>;
    return (
      <div className={`${sizeClass} rounded-full bg-bg-secondary border-4 border-bg-base flex items-center justify-center font-bold text-text-main shadow-sm overflow-hidden relative`}>
        {entry.avatar ? (
          <img src={entry.avatar} className="w-full h-full object-cover" alt={entry.name} />
        ) : (
          <span>{entry.name?.charAt(0) || '?'}</span>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-8">
      
      {/* Header */}
      <div className="flex items-center justify-center mb-6 relative">
        <h1 className="text-xl font-bold text-text-main">Leaderboard</h1>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-bg-secondary rounded-full p-1 mb-8 mx-auto w-full max-w-[320px]">
        <button 
          onClick={() => setTimeFilter('daily')}
          className={`flex-1 py-2 rounded-full font-bold text-[13px] transition-all ${timeFilter === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
        >
          Daily
        </button>
        <button 
          onClick={() => setTimeFilter('monthly')}
          className={`flex-1 py-2 rounded-full font-bold text-[13px] transition-all ${timeFilter === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
        >
          Monthly
        </button>
        <button 
          onClick={() => setTimeFilter('all')}
          className={`flex-1 py-2 rounded-full font-bold text-[13px] transition-all ${timeFilter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
        >
          All time
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-text-tertiary" size={32} />
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="relative pt-12 pb-6 px-4 mb-4">
              <div className="flex items-end justify-center h-[180px] relative z-10 gap-2 max-w-[340px] mx-auto">
                
                {/* 2nd Place */}
                <div className="flex flex-col items-center w-[30%] relative">
                  <div className="relative mb-2">
                    {renderAvatar(top3[1], "w-16 h-16")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-bg-base z-10 shadow-sm">
                      2
                    </div>
                  </div>
                  <div className="bg-bg-card shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] rounded-t-2xl w-full h-[100px] flex flex-col items-center justify-end pb-4 pt-6 mt-2 relative border border-border border-b-0">
                    <span className="text-[13px] font-bold text-text-main truncate w-[90%] text-center">{top3[1]?.name?.split(' ')[0] || '-'}</span>
                    <span className="text-[11px] font-semibold text-primary mt-0.5">{top3[1]?.xp ? `${top3[1].xp} XP` : '-'}</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center w-[36%] relative z-20">
                  <Crown className="text-primary absolute -top-10 animate-bounce-sm" size={28} fill="currentColor" />
                  <div className="relative mb-2">
                    {renderAvatar(top3[0], "w-20 h-20")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-bg-base z-10 shadow-sm">
                      1
                    </div>
                  </div>
                  <div className="bg-bg-card shadow-[0_-15px_25px_-5px_rgba(0,0,0,0.08)] rounded-t-2xl w-full h-[120px] flex flex-col items-center justify-end pb-4 pt-6 mt-2 relative border border-border border-b-0">
                    <span className="text-[14px] font-bold text-text-main truncate w-[90%] text-center">{top3[0]?.name?.split(' ')[0] || '-'}</span>
                    <span className="text-[11px] font-semibold text-primary mt-0.5">{top3[0]?.xp ? `${top3[0].xp} XP` : '-'}</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center w-[30%] relative">
                  <div className="relative mb-2">
                    {renderAvatar(top3[2], "w-16 h-16")}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-bg-base z-10 shadow-sm">
                      3
                    </div>
                  </div>
                  <div className="bg-bg-card shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] rounded-t-2xl w-full h-[85px] flex flex-col items-center justify-end pb-3 pt-6 mt-2 relative border border-border border-b-0">
                    <span className="text-[13px] font-bold text-text-main truncate w-[90%] text-center">{top3[2]?.name?.split(' ')[0] || '-'}</span>
                    <span className="text-[11px] font-semibold text-primary mt-0.5">{top3[2]?.xp ? `${top3[2].xp} XP` : '-'}</span>
                  </div>
                </div>
                
              </div>
              {/* Pedestal Base Line */}
              <div className="h-4 bg-bg-card shadow-sm rounded-b-xl w-full max-w-[360px] mx-auto relative z-0 border border-t-0 border-border" />
            </div>
          )}

          {/* List */}
          <div className="space-y-3 px-2">
            {rest.map((student) => (
              <div 
                key={student.rank} 
                className={`flex items-center p-3.5 bg-bg-card rounded-[16px] border border-border shadow-sm transition ${student.isMe ? 'ring-2 ring-primary/20' : ''}`}
              >
                <div className="w-8 font-bold text-text-main text-[15px] text-center mr-2">
                  {student.rank}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center mr-3 text-text-secondary font-bold text-sm overflow-hidden border border-border shadow-sm">
                  {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name?.charAt(0) || '?'}
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-bold text-[15px] ${student.isMe ? 'text-text-main' : 'text-text-main'}`}>
                    {student.name} {student.isMe && <span className="text-text-tertiary font-medium text-xs ml-1">(You)</span>}
                  </h4>
                </div>
                
                <div className="font-semibold text-[13px] text-primary">
                  {student.xp} XP
                </div>
              </div>
            ))}
            
            {leaderboard.length === 0 && (
              <div className="py-8 px-4 text-center text-text-secondary font-medium">
                No users on the leaderboard yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
