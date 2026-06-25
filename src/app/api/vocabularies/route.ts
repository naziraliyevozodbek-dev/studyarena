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

    // Verify mentor owns this course
    const courseId = body.course_id || (body.words && body.words[0]?.course_id);
    if (!courseId) return NextResponse.json({ error: 'Missing course_id' }, { status: 400 });

    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', mentorId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }

    // Get current max lesson_number
    const { data: vocab } = await supabaseAdmin
      .from('vocabularies')
      .select('lesson_number')
      .eq('course_id', courseId)
      .order('lesson_number', { ascending: false })
      .limit(1);
    const providedLessonNumber = body.lesson_number ? parseInt(body.lesson_number, 10) : null;
    const nextLessonNumber = providedLessonNumber || (vocab && vocab.length > 0 ? vocab[0].lesson_number + 1 : 1);

    let result;
    if (body.words && Array.isArray(body.words)) {
      // Bulk insert
      const insertData = body.words.map((w: any) => ({
        course_id: courseId,
        german_word: w.german_word,
        translation: w.translation,
        lesson_number: providedLessonNumber || (w.lesson_number ? parseInt(w.lesson_number, 10) : nextLessonNumber)
      }));

      const { data, error } = await supabaseAdmin
        .from('vocabularies')
        .insert(insertData)
        .select();

      if (error) throw error;
      result = data;
    } else {
      // Single insert
      const { course_id, german_word, translation, example_german, example_uzbek } = body;
      if (!german_word || !translation) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      // We only insert example fields if they are provided, to prevent errors if the DB migration wasn't fully run
      const insertObj: any = {
        course_id,
        german_word,
        translation,
        lesson_number: nextLessonNumber
      };
      if (example_german) insertObj.example_german = example_german;
      if (example_uzbek) insertObj.example_uzbek = example_uzbek;

      const { data: newVocab, error } = await supabaseAdmin
        .from('vocabularies')
        .insert(insertObj)
        .select()
        .single();

      if (error) {
        console.error("Vocab insert error:", error);
        throw error;
      }
      result = newVocab;
    }

    return NextResponse.json({ vocabulary: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
