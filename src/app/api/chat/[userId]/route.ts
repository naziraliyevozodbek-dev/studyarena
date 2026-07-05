import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

// GET messages between current user and userId
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const otherUserId = (await params).userId;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark unread messages as read
    const unreadIds = data.filter(m => m.receiver_id === currentUserId && !m.is_read).map(m => m.id);
    if (unreadIds.length > 0) {
      await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds);
    }

    return NextResponse.json({ messages: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message
export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const otherUserId = (await params).userId;

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
