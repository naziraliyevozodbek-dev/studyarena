import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const { course_code } = await req.json();

    if (!course_code) return NextResponse.json({ error: 'Missing course_code' }, { status: 400 });

    // Find course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('course_code', course_code.toUpperCase())
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('course_members')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', decoded.sub)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
    }

    // Enroll
    const { error: enrollError } = await supabaseAdmin
      .from('course_members')
      .insert({
        course_id: course.id,
        student_id: decoded.sub
      });

    if (enrollError) throw enrollError;

    return NextResponse.json({ success: true, course_id: course.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
