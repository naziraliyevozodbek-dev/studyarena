import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('course_members')
      .select('course_id, courses(*)')
      .eq('student_id', decoded.sub)
      .order('created_at', { ascending: false });

    if (memberError) throw memberError;

    const courses = memberData?.map(m => m.courses) || [];

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
