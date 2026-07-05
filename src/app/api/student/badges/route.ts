import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const studentId = decoded.sub;

    const { data: badges, error } = await supabaseAdmin
      .from('user_badges')
      .select('badge_type, earned_at')
      .eq('student_id', studentId);

    if (error) throw error;

    return NextResponse.json({ badges: badges || [] });
  } catch (err: unknown) {
    console.error('Badges fetch error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
