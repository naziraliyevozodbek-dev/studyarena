import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, studentId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const { id: courseId, studentId } = await params;

    // Verify ownership of the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete enrollment
    const { error: deleteError } = await supabaseAdmin
      .from('course_members')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (deleteError) {
      throw deleteError;
    }

    // Send a notification to the student
    await supabaseAdmin.from('notifications').insert({
      user_id: studentId,
      title: "Kursdan chetlashtirildingiz",
      message: `Siz mentor tomonidan ushbu kursdan chetlashtirildingiz.`,
      type: "course"
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Remove student error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
