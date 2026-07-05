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

    let chatUsers = [];

    if (user.role === 'mentor') {
      // Mentor sees all their students
      const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('mentor_id', userId);
        
      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { data: enrollments } = await supabaseAdmin
          .from('course_enrollments')
          .select('student_id, users!course_enrollments_student_id_fkey(id, full_name, username, avatar_url)')
          .in('course_id', courseIds);

        if (enrollments) {
          // unique students
          const studentMap = new Map();
          enrollments.forEach(e => {
            const user = Array.isArray(e.users) ? e.users[0] : e.users;
            if (user && !studentMap.has(user.id)) {
              studentMap.set(user.id, user);
            }
          });
          chatUsers = Array.from(studentMap.values());
        }
      }
    } else {
      // Student sees their mentor(s)
      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select('courses(mentor_id, users!courses_mentor_id_fkey(id, full_name, username, avatar_url))')
        .eq('student_id', userId);

      if (enrollments) {
        const mentorMap = new Map();
        enrollments.forEach(e => {
          const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          if (course?.users) {
            const user = Array.isArray(course.users) ? course.users[0] : course.users;
            if (user && !mentorMap.has(user.id)) {
              mentorMap.set(user.id, user);
            }
          }
        });
        chatUsers = Array.from(mentorMap.values());
      }
    }

    return NextResponse.json({ users: chatUsers });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
