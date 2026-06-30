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
    const { vocabulary_id, is_starred } = body;

    if (!vocabulary_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studentId = decoded.sub;

    // Upsert vocabulary progress to update is_starred
    const { error: upsertError } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .upsert({
        student_id: studentId,
        vocabulary_id: vocabulary_id,
        is_starred: is_starred,
        last_reviewed_at: new Date().toISOString()
      }, { onConflict: 'student_id,vocabulary_id' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, is_starred });
  } catch (err: unknown) {
    console.error('Star error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
