import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const studentId = decoded.sub;

    if (!studentId) return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });

    // 1. Reset user XP, level, and streak
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ xp: 0, level: 1, streak: 0 })
      .eq('id', studentId);

    if (userError) throw userError;

    // 2. Delete all progress in student_vocabulary_progress
    const { error: progressError } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .delete()
      .eq('student_id', studentId);

    if (progressError) throw progressError;

    // 3. (Optional) Delete activity logs
    await supabaseAdmin
      .from('user_activity_logs')
      .delete()
      .eq('student_id', studentId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reset progress error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

