import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const userId = decoded.sub;

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('User not found');

    let groups = [];

    if (user.role === 'mentor') {
      // Mentor sees their courses
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .eq('mentor_id', userId);
        
      if (courses) {
        groups = courses.map(c => ({ id: c.id, name: c.title, type: 'course' }));
      }
    } else {
      // Student sees their enrolled courses
      const { data: enrollments } = await supabaseAdmin
        .from('course_members')
        .select('course_id, courses(*)')
        .eq('student_id', userId);

      if (enrollments) {
        const courseMap = new Map();
        enrollments.forEach((e: any) => {
          const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          if (course && !courseMap.has(course.id)) {
            courseMap.set(course.id, { id: course.id, name: course.title, type: 'course' });
          }
        });
        groups = Array.from(courseMap.values());
      }
    }

    return NextResponse.json({ groups });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}
