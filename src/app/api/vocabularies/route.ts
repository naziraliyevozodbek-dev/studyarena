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
    const { course_id, german_word, translation } = body;

    // Verify course ownership
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('mentor_id')
      .eq('id', course_id)
      .single();

    if (courseError || !course || course.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: vocab, error: vocabError } = await supabaseAdmin
      .from('vocabularies')
      .insert({
        course_id,
        german_word,
        translation
      })
      .select()
      .single();

    if (vocabError) throw vocabError;

    return NextResponse.json({ vocabulary: vocab }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
