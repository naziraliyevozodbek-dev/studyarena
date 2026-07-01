import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const studentId = decoded.sub;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // If table doesn't exist yet, just return empty array gracefully
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const studentId = decoded.sub;

    // Mark all as read
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('student_id', studentId)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
