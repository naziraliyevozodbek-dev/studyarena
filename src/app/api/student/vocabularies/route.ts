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
    const courseId = url.searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

    // Check if enrolled
    const { data: member } = await supabaseAdmin
      .from('course_members')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', decoded.sub)
      .single();

    if (!member) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });

    const { data: vocabularies, error: vocabError } = await supabaseAdmin
      .from('vocabularies')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (vocabError) throw vocabError;

    return NextResponse.json({ vocabularies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
