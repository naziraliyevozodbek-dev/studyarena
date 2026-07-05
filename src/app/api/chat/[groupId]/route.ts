import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

// GET messages for a group (course)
export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const courseId = (await params).groupId;

    // Check if user is enrolled or mentor
    const { data: course } = await supabaseAdmin.from('courses').select('title, mentor_id').eq('id', courseId).single();
    const { data: enrollment } = await supabaseAdmin.from('course_members').select('id').eq('course_id', courseId).eq('student_id', currentUserId).single();

    if (course?.mentor_id !== currentUserId && !enrollment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { count: studentCount } = await supabaseAdmin.from('course_members').select('*', { count: 'exact', head: true }).eq('course_id', courseId);

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      messages: data, 
      courseName: course?.title || 'Guruh Chati', 
      memberCount: (studentCount || 0) + 1 
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message to group
export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const courseId = (await params).groupId;

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: currentUserId,
        course_id: courseId,
        content: content.trim()
      })
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role)')
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// DELETE a message
export async function DELETE(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    
    // Message ID to delete passed in URL query param: ?messageId=...
    const url = new URL(req.url);
    const messageId = url.searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const { data: msg } = await supabaseAdmin.from('messages').select('sender_id').eq('id', messageId).single();
    if (!msg || msg.sender_id !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('messages').delete().eq('id', messageId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
