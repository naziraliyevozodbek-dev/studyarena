import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

// POST mark messages as read
export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    
    const { messageIds } = await req.json();

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const records = messageIds.map(id => ({
      message_id: id,
      user_id: currentUserId,
    }));

    const { error } = await supabaseAdmin
      .from('message_reads')
      .upsert(records, { onConflict: 'message_id,user_id', ignoreDuplicates: true });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to mark read', err);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
