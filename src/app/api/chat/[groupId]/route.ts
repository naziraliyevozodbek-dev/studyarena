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
    
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor'); // expected to be an ISO timestamp
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Check if user is enrolled or mentor
    const { data: course } = await supabaseAdmin.from('courses').select('title, mentor_id').eq('id', courseId).single();
    const { data: enrollment } = await supabaseAdmin.from('course_members').select('id').eq('course_id', courseId).eq('student_id', currentUserId).single();

    let roomId = courseId;
    let courseInfo = course;
    
    // First check if groupId is a chat_room id
    const { data: room } = await supabaseAdmin.from('chat_rooms').select('*').eq('id', courseId).single();
    if (room) {
      roomId = room.id;
      if (!courseInfo) {
        const { data: c } = await supabaseAdmin.from('courses').select('title, mentor_id').eq('id', room.course_id).single();
        courseInfo = c;
      }
    } else {
      // It's a courseId, find its general room
      const { data: generalRoom } = await supabaseAdmin.from('chat_rooms').select('id').eq('course_id', courseId).eq('type', 'general').single();
      if (generalRoom) roomId = generalRoom.id;
    }

    if (courseInfo?.mentor_id !== currentUserId && !enrollment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { count: studentCount } = await supabaseAdmin.from('course_members').select('*', { count: 'exact', head: true }).eq('course_id', room?.course_id || courseId);

    let query = supabaseAdmin
      .from('messages')
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role), message_reactions(*), message_reads(*), message_files(*)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    // We got the newest 'limit' messages before the cursor (or newest overall), ordered descending.
    // We need to reverse them to return in chronological order.
    const chronologicalMessages = data.reverse();

    // Filter out messages deleted for this user
    const visibleMessages = chronologicalMessages.filter(m => !m.deleted_for_users?.includes(currentUserId));

    const { data: pinnedData } = await supabaseAdmin
      .from('pinned_messages')
      .select('*, messages(*, users!messages_sender_id_fkey(full_name, avatar_url, role))')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
      roomId,
      messages: visibleMessages,
      hasMore: data.length === limit,
      pinnedMessages: pinnedData || [],
      courseName: courseInfo?.title || 'Guruh Chati', 
      memberCount: (studentCount || 0) + 1 
    });
  } catch (err: unknown) {
    console.error(err);
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

    const { content, reply_to_message_id, file } = await req.json();

    if ((!content || typeof content !== 'string') && !file) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    let roomId = courseId;
    const { data: room } = await supabaseAdmin.from('chat_rooms').select('id, course_id').eq('id', courseId).single();
    let actualCourseId = courseId;
    
    if (room) {
      roomId = room.id;
      actualCourseId = room.course_id;
    } else {
      const { data: generalRoom } = await supabaseAdmin.from('chat_rooms').select('id').eq('course_id', courseId).eq('type', 'general').single();
      if (generalRoom) roomId = generalRoom.id;
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: currentUserId,
        course_id: actualCourseId, // keep for backward compatibility
        room_id: roomId,
        reply_to_message_id,
        content: content ? content.trim() : ''
      })
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role)')
      .single();

    if (error) throw error;
    
    if (file && data) {
      await supabaseAdmin.from('message_files').insert({
        message_id: data.id,
        file_url: file.file_url,
        file_type: file.file_type,
        file_size: file.file_size,
        file_name: file.file_name
      });
    }
    
    // Re-fetch message with all relations
    const { data: finalMsg } = await supabaseAdmin
      .from('messages')
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role), message_reactions(*), message_reads(*), message_files(*)')
      .eq('id', data.id)
      .single();

    // Telegram Push Notifications
    // Find course members for this chat
    const { data: members } = await supabaseAdmin
      .from('course_members')
      .select('student_id, users(id, telegram_id, full_name)')
      .eq('course_id', actualCourseId);

    // Also get mentor
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('mentor_id, users!courses_mentor_id_fkey(id, telegram_id, full_name), title')
      .eq('id', actualCourseId)
      .single();

    const usersToNotify: any[] = [];
    if (members) {
      members.forEach((m: any) => {
        if (m.users?.id !== currentUserId && m.users?.telegram_id) {
          usersToNotify.push(m.users.telegram_id);
        }
      });
    }
    const courseUser = Array.isArray(course?.users) ? course?.users[0] : course?.users;
    if (courseUser?.id !== currentUserId && courseUser?.telegram_id) {
      usersToNotify.push(courseUser.telegram_id);
    }

    if (usersToNotify.length > 0) {
      const senderName = finalMsg?.users?.full_name || 'Birov';
      const courseName = course?.title || 'Guruh';
      const textPreview = content ? (content.length > 50 ? content.slice(0, 50) + '...' : content) : (file ? `📎 ${file.file_name}` : 'Yangi xabar');
      const tgMsg = `💬 *${courseName}*\n${senderName}: ${textPreview}`;
      
      const { bot } = await import('@/lib/bot');
      Promise.allSettled(usersToNotify.map(tgId => 
        bot.api.sendMessage(tgId, tgMsg, { parse_mode: 'Markdown' })
      )).catch(err => console.error('TG Notification error:', err));
    }

    return NextResponse.json({ message: finalMsg });
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

// PUT to edit a message
export async function PUT(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    
    const { messageId, content } = await req.json();

    if (!messageId || !content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data: msg } = await supabaseAdmin.from('messages').select('sender_id').eq('id', messageId).single();
    if (!msg || msg.sender_id !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ content: content.trim(), is_edited: true })
      .eq('id', messageId)
      .select('*, users!messages_sender_id_fkey(full_name, avatar_url, role), message_reactions(*), message_reads(*), message_files(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }
}
