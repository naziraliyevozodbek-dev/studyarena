import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const body = await req.json();
    const { vocabulary_id, status } = body;

    if (!vocabulary_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studentId = decoded.sub;

    // 1. Get current progress if exists
    const { data: existingProgress } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .select('mistakes_count')
      .eq('student_id', studentId)
      .eq('vocabulary_id', vocabulary_id)
      .single();

    let newMistakesCount = existingProgress?.mistakes_count || 0;
    let finalStatus = status;

    if (status === 'weak') {
      newMistakesCount += 1;
      // If student clicks "Don't know" even once, it becomes weak until they learn it properly
      finalStatus = 'weak';
    } else if (status === 'learned') {
      // If they had too many mistakes, maybe we still keep it 'weak' but just incremented? 
      // No, if they click 'I know', we mark it as 'learned' for now.
      finalStatus = 'learned';
    }

    // 2. Upsert vocabulary progress
    const { error: upsertError } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .upsert({
        student_id: studentId,
        vocabulary_id: vocabulary_id,
        status: finalStatus,
        mistakes_count: newMistakesCount,
        last_reviewed_at: new Date().toISOString()
      }, { onConflict: 'student_id,vocabulary_id' });

    if (upsertError) throw upsertError;

    // 3. Log daily activity for streak
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingLog } = await supabaseAdmin
      .from('user_activity_logs')
      .select('words_practiced, xp_earned')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    const wordsPracticed = (existingLog?.words_practiced || 0) + 1;
    const xpEarned = (existingLog?.xp_earned || 0) + (status === 'learned' ? 2 : 1); // 2 XP for learned, 1 for practice

    await supabaseAdmin
      .from('user_activity_logs')
      .upsert({
        student_id: studentId,
        date: today,
        words_practiced: wordsPracticed,
        xp_earned: xpEarned,
        created_at: new Date().toISOString()
      }, { onConflict: 'student_id,date' });

    // 4. Update total XP in users table
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('xp')
      .eq('id', studentId)
      .single();
      
    if (user) {
      await supabaseAdmin
        .from('users')
        .update({ xp: (user.xp || 0) + (status === 'learned' ? 2 : 1) })
        .eq('id', studentId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Progress error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
