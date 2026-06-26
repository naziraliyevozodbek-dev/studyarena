import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    // Get all courses the student is enrolled in
    const { data: members, error: membersError } = await supabaseAdmin
      .from('course_members')
      .select('course_id')
      .eq('student_id', decoded.sub);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const courseIds = members.map(m => m.course_id);

    // Fetch homeworks for these courses
    const { data: homeworks, error: hwError } = await supabaseAdmin
      .from('homeworks')
      .select('*, courses(title)')
      .in('course_id', courseIds)
      .order('deadline', { ascending: true });

    if (hwError) throw hwError;

    // Fetch student's submissions for these homeworks
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('homework_submissions')
      .select('*')
      .eq('student_id', decoded.sub);

    if (subError) throw subError;

    // Merge submissions into homeworks
    const tasks = homeworks?.map(hw => {
      const submission = submissions?.find(s => s.homework_id === hw.id);
      return {
        ...hw,
        submission: submission || null
      };
    });

    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
