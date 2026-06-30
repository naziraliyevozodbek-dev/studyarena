import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const mentorId = decoded.sub;
    const courseId = (await params).id;

    // Verify course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', mentorId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }

    // Get students in course
    const { data: members, error } = await supabaseAdmin
      .from('course_members')
      .select('student_id')
      .eq('course_id', courseId);

    if (error) throw error;

    if (!members || members.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = members.map((m: any) => m.student_id);

    if (studentIds.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, username, avatar_url, xp, level')
      .in('id', studentIds);

    if (usersError) throw usersError;

    // Get weekly XP for these students
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: activityLogs } = await supabaseAdmin
      .from('user_activity_logs')
      .select('student_id, xp_earned')
      .in('student_id', studentIds)
      .gte('date', dateStr);

    const studentsWithActivity = (users || []).map((u: any) => {
      const weeklyXp = activityLogs
        ?.filter((log: any) => log.student_id === u.id)
        .reduce((sum: number, log: any) => sum + (log.xp_earned || 0), 0) || 0;
      
      return {
        ...u,
        weeklyXp
      };
    });

    return NextResponse.json({ students: studentsWithActivity });
  } catch (err: unknown) {
    console.error('Students API error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
