import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const studentId = decoded.sub;

    // Get dates for the last 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const { data: logs, error } = await supabaseAdmin
      .from('user_activity_logs')
      .select('date, words_practiced, xp_earned')
      .eq('student_id', studentId)
      .in('date', dates);

    if (error) throw error;

    // Format for the calendar widget
    const activityDays = dates.map(dateStr => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const log = logs?.find(l => l.date === dateStr);
      
      return {
        date: dateStr,
        day: dayName,
        active: !!log && log.words_practiced > 0
      };
    });

    return NextResponse.json({ activityDays });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
