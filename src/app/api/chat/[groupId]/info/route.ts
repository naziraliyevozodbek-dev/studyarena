import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

// GET group info and members
export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const courseId = (await params).groupId;
    
    // First check if groupId is a chat_room id
    const { data: room } = await supabaseAdmin.from('chat_rooms').select('*').eq('id', courseId).single();
    let actualCourseId = courseId;
    if (room) {
      actualCourseId = room.course_id;
    }

    // Check enrollment or mentor
    const { data: course } = await supabaseAdmin.from('courses').select('title, mentor_id, users!courses_mentor_id_fkey(id, full_name, avatar_url, role)').eq('id', actualCourseId).single();
    const { data: enrollment } = await supabaseAdmin.from('course_members').select('id').eq('course_id', actualCourseId).eq('student_id', currentUserId).single();

    if (course?.mentor_id !== currentUserId && !enrollment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch members
    const { data: members } = await supabaseAdmin
      .from('course_members')
      .select('users(id, full_name, avatar_url, role)')
      .eq('course_id', actualCourseId);

    const mentor = Array.isArray(course?.users) ? course?.users[0] : course?.users;
    
    const formattedMembers = [
      mentor,
      ...(members?.map((m: any) => m.users) || [])
    ].filter(Boolean);

    return NextResponse.json({ 
      courseId: actualCourseId,
      roomName: room?.name || course?.title || 'Umumiy Chat',
      roomAvatar: room?.avatar_url || null,
      isMentor: course?.mentor_id === currentUserId,
      members: formattedMembers
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update group info (mentor only)
export async function PUT(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const currentUserId = decoded.sub;
    const courseId = (await params).groupId;
    
    const { name, avatar_url } = await req.json();

    const { data: room } = await supabaseAdmin.from('chat_rooms').select('*').eq('id', courseId).single();
    let actualCourseId = courseId;
    let roomId = courseId;

    if (room) {
      actualCourseId = room.course_id;
      roomId = room.id;
    } else {
      const { data: generalRoom } = await supabaseAdmin.from('chat_rooms').select('id').eq('course_id', courseId).eq('type', 'general').single();
      if (generalRoom) roomId = generalRoom.id;
    }

    const { data: course } = await supabaseAdmin.from('courses').select('mentor_id').eq('id', actualCourseId).single();

    if (course?.mentor_id !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden. Only mentor can edit group info.' }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { error } = await supabaseAdmin.from('chat_rooms').update(updateData).eq('id', roomId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
