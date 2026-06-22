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

    // Fetch weak words for the student
    const { data: weakProgress, error: progressError } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .select('vocabulary_id, mistakes_count')
      .eq('student_id', studentId)
      .eq('status', 'weak')
      .order('mistakes_count', { ascending: false });

    if (progressError) throw progressError;

    if (!weakProgress || weakProgress.length === 0) {
      return NextResponse.json({ vocabularies: [] });
    }

    const vocabIds = weakProgress.map(wp => wp.vocabulary_id);

    // Fetch vocabulary details
    const { data: vocabularies, error: vocabError } = await supabaseAdmin
      .from('vocabularies')
      .select('*, courses(title)')
      .in('id', vocabIds);

    if (vocabError) throw vocabError;

    return NextResponse.json({ vocabularies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
