import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // 1. Reset user XP and level to 0/1
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ xp: 0, level: 1 })
      .eq('id', user.id);

    if (userError) throw userError;

    // 2. Delete all progress in vocabulary_progress
    const { error: progressError } = await supabaseAdmin
      .from('vocabulary_progress')
      .delete()
      .eq('student_id', user.id);

    if (progressError) throw progressError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
