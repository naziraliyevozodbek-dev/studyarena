import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const courseId = (await params).id;

    // Fetch course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;
    
    // Check ownership
    if (course.mentor_id !== decoded.sub) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch vocabularies
    const { data: vocabularies, error: vocabError } = await supabaseAdmin
      .from('vocabularies')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (vocabError) throw vocabError;

    // Fetch homeworks
    const { data: homeworks, error: homeworkError } = await supabaseAdmin
      .from('homeworks')
      .select('*, _count:homework_submissions(count)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (homeworkError) throw homeworkError;

    return NextResponse.json({ course, vocabularies, homeworks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
