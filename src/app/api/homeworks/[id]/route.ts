import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const homeworkId = params.id;

    // Fetch homework
    const { data: homework, error: hwError } = await supabaseAdmin
      .from('homeworks')
      .select('*, courses(*)')
      .eq('id', homeworkId)
      .single();

    if (hwError || !homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    if (homework.courses.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch submissions
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('homework_submissions')
      .select('*, users(full_name, avatar_url, username)')
      .eq('homework_id', homeworkId)
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    return NextResponse.json({ homework, submissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
