import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    // Get all courses student is enrolled in
    const { data: memberData } = await supabaseAdmin
      .from('course_members')
      .select('course_id')
      .eq('student_id', decoded.sub);

    if (!memberData || memberData.length === 0) {
      return NextResponse.json({ challenges: [] });
    }

    const courseIds = memberData.map(m => m.course_id);

    // Fetch challenges for these courses
    const { data: challenges, error } = await supabaseAdmin
      .from('challenges')
      .select('id, course_id, title, description, xp_reward, deadline, created_at, courses(title), challenge_submissions(status, student_id)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter submissions to only include the current student's submissions
    const filteredChallenges = challenges?.map(challenge => ({
      ...challenge,
      challenge_submissions: challenge.challenge_submissions?.filter((sub: any) => sub.student_id === decoded.sub) || []
    })) || [];

    return NextResponse.json({ challenges: filteredChallenges });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
