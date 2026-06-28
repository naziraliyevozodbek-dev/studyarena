import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    // First find all courses owned by this mentor
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('mentor_id', decoded.sub);
      
    if (!courses || courses.length === 0) {
      return NextResponse.json({ challenges: [] });
    }
    
    const courseIds = courses.map(c => c.id);

    // Then fetch challenges for these courses
    const { data: challenges, error } = await supabaseAdmin
      .from('challenges')
      .select('id, course_id, title, description, xp_reward, deadline, created_at, courses(title)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ challenges });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const body = await req.json();
    const { course_id, title, description, xp_reward, deadline } = body;
    
    // Verify mentor owns the course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', course_id)
      .eq('mentor_id', decoded.sub)
      .single();
      
    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }

    const { data: challenge, error } = await supabaseAdmin
      .from('challenges')
      .insert([{
        course_id,
        title,
        description: description || null,
        xp_reward: parseInt(xp_reward) || 0,
        deadline: deadline || null
      }])
      .select('*, courses(title)')
      .single();

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing challenge id' }, { status: 400 });
    }

    // Verify ownership
    const { data: challenge } = await supabaseAdmin
      .from('challenges')
      .select('course_id, courses!inner(mentor_id)')
      .eq('id', id)
      .single();

    if (!challenge || (challenge.courses as any)?.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('challenges').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
