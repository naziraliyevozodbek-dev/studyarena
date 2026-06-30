import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    // Get all courses the student is enrolled in
    const { data: members, error: membersError } = await supabaseAdmin
      .from('course_members')
      .select('course_id')
      .eq('student_id', decoded.sub);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return NextResponse.json({ vocabularies: [] });
    }

    const courseIds = members.map(m => m.course_id);

    // Fetch vocabularies for these courses
    const { data: vocabularies, error: vocabError } = await supabaseAdmin
      .from('vocabularies')
      .select('*, courses(title)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (vocabError) throw vocabError;

    // Fetch progress for this student
    const { data: progress } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .select('vocabulary_id, status, is_starred')
      .eq('student_id', decoded.sub);

    const progressMap = new Map(progress?.map(p => [p.vocabulary_id, p]) || []);

    const enrichedVocabularies = vocabularies?.map(v => ({
      ...v,
      is_starred: progressMap.get(v.id)?.is_starred || false,
      progress_status: progressMap.get(v.id)?.status || 'learning'
    })) || [];

    // Optionally filter out 'learned' if you don't want them to appear at all
    // But since UI handles sessionCompleted, we can return all or filter here. 
    // Usually better to return non-learned.
    const activeVocabs = enrichedVocabularies.filter(v => v.progress_status !== 'learned');

    return NextResponse.json({ vocabularies: activeVocabs.length > 0 ? activeVocabs : enrichedVocabularies });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
