import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const submissionId = params.id;
    const { status, score } = await req.json();

    if (!['graded', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify ownership
    const { data: submission, error: subError } = await supabaseAdmin
      .from('homework_submissions')
      .select('*, homeworks(*, courses(*))')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.homeworks.courses.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update submission
    const { error: updateError } = await supabaseAdmin
      .from('homework_submissions')
      .update({
        status,
        score: score !== undefined ? score : submission.homeworks.xp_reward
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // If approved, add XP to student
    if (status === 'graded') {
      const awardedScore = score !== undefined ? score : submission.homeworks.xp_reward;
      
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('xp')
        .eq('id', submission.student_id)
        .single();

      if (student) {
        await supabaseAdmin
          .from('users')
          .update({ xp: (student.xp || 0) + awardedScore })
          .eq('id', submission.student_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Grading error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
