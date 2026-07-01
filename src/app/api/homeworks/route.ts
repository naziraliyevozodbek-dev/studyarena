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
    const { course_id, title, description, xp_reward, deadline } = body;

    if (!course_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify mentor owns the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('mentor_id, title')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert homework
    const { data: homework, error: insertError } = await supabaseAdmin
      .from('homeworks')
      .insert({
        course_id,
        title,
        description: description || null,
        xp_reward: xp_reward || 0,
        deadline: deadline ? new Date(deadline).toISOString() : null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify enrolled students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('student_id')
      .eq('course_id', course_id);

    if (enrollments && enrollments.length > 0) {
      const notifications = enrollments.map(e => ({
        student_id: e.student_id,
        title: "Yangi vazifa!",
        message: `"${course.title}" kursida yangi vazifa qo'shildi: ${title}`,
        type: "homework",
        related_id: homework.id
      }));
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    return NextResponse.json({ homework }, { status: 201 });
  } catch (err: unknown) {
    console.error('Create homework error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
