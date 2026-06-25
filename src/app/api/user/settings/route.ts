import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const userId = decoded.sub;

    const body = await req.json();
    const { full_name, role } = body;

    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Update settings error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
