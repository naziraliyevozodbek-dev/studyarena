import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('course_members')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', decoded.sub);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
