import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const mentorId = decoded.sub;

    const body = await req.json();
    const { course_id, german_word, translation, example_german, example_uzbek } = body;

    if (!course_id || !german_word || !translation) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify mentor owns this course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('mentor_id', mentorId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }

    // Get current max lesson_number
    const { data: vocab } = await supabaseAdmin
      .from('vocabularies')
      .select('lesson_number')
      .eq('course_id', course_id)
      .order('lesson_number', { ascending: false })
      .limit(1);
    
    const nextLessonNumber = vocab && vocab.length > 0 ? vocab[0].lesson_number + 1 : 1;

    const { data: newVocab, error } = await supabaseAdmin
      .from('vocabularies')
      .insert({
        course_id,
        german_word,
        translation,
        example_german,
        example_uzbek,
        lesson_number: nextLessonNumber
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vocabulary: newVocab }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
