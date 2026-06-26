import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'all'; // 'daily', 'monthly', 'all'

    // Get student's courses to find peers
    const { data: myCourses } = await supabaseAdmin
      .from('course_members')
      .select('course_id')
      .eq('student_id', decoded.sub);

    const peerIds = [decoded.sub]; // Self is always included
    if (myCourses && myCourses.length > 0) {
      const courseIds = myCourses.map(c => c.course_id);
      const { data: peers } = await supabaseAdmin
        .from('course_members')
        .select('student_id')
        .in('course_id', courseIds);
      
      if (peers) {
        peers.forEach(p => {
          if (!peerIds.includes(p.student_id)) peerIds.push(p.student_id);
        });
      }
    }

    let leaderboardData: any[] = [];

    if (filter === 'all') {
      // Just fetch total XP from users table
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, full_name, username, xp, avatar_url')
        .in('id', peerIds)
        .order('xp', { ascending: false });

      if (error) throw error;
      leaderboardData = data || [];
    } else {
      // Filter by daily or monthly using user_activity_logs
      let dateFrom = new Date();
      if (filter === 'daily') {
        dateFrom.setHours(0, 0, 0, 0); // Start of today
      } else if (filter === 'monthly') {
        dateFrom.setDate(1);
        dateFrom.setHours(0, 0, 0, 0); // Start of this month
      }

      const { data: logs, error: logsError } = await supabaseAdmin
        .from('user_activity_logs')
        .select('student_id, xp_earned')
        .in('student_id', peerIds)
        .gte('date', dateFrom.toISOString().split('T')[0]);

      if (logsError) throw logsError;

      // Aggregate XP per student
      const xpMap: Record<string, number> = {};
      peerIds.forEach(id => xpMap[id] = 0);

      logs?.forEach(log => {
        xpMap[log.student_id] += (log.xp_earned || 0);
      });

      // Now fetch user details
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, full_name, username, avatar_url')
        .in('id', peerIds);

      if (usersError) throw usersError;

      leaderboardData = users?.map(u => ({
        ...u,
        xp: xpMap[u.id] || 0
      })) || [];

      // Sort by aggregated XP
      leaderboardData.sort((a, b) => b.xp - a.xp);
    }

    return NextResponse.json({ leaderboard: leaderboardData });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
