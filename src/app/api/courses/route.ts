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
    
    // Fetch courses for this mentor
    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        _count:course_members (count)
      `)
      .eq('mentor_id', decoded.sub)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ courses });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

import { z } from 'zod';

const CourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  course_code: z.string().min(6, "Course code must be at least 6 characters").max(15, "Course code must be at most 15 characters"),
  image_url: z.string().optional()
});

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = CourseSchema.parse(body);
    const { title, description, course_code } = validatedData;

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert({
        title,
        description: description || null,
        course_code,
        image_url: validatedData.image_url || null,
        mentor_id: decoded.sub
      })
      .select()
      .single();

    if (error) {
      console.error('Course insert error:', error);
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (err: unknown) {
    console.error('Course creation error:', err);
    if (err instanceof z.ZodError) {
      const zodErr = err as any;
      return NextResponse.json({ error: zodErr.errors?.[0]?.message || 'Validation error' }, { status: 400 });
    }
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
    const courseId = url.searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    // Verify ownership before deleting
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    if (!course || course.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden or Not Found' }, { status: 403 });
    }

    // Storage Cleanup: Find and delete all homework submission files
    const { data: homeworks } = await supabaseAdmin
      .from('homeworks')
      .select('id')
      .eq('course_id', courseId);

    if (homeworks && homeworks.length > 0) {
      const homeworkIds = homeworks.map((hw: any) => hw.id);
      
      const { data: submissions } = await supabaseAdmin
        .from('homework_submissions')
        .select('content')
        .in('homework_id', homeworkIds);

      if (submissions && submissions.length > 0) {
        const filesToRemove: string[] = [];
        submissions.forEach((sub: any) => {
          if (sub.content && sub.content.includes('/storage/v1/object/public/homework-files/')) {
            const parts = sub.content.split('/homework-files/');
            if (parts.length > 1) {
              filesToRemove.push(parts[1]);
            }
          }
        });

        if (filesToRemove.length > 0) {
          try {
            await supabaseAdmin.storage.from('homework-files').remove(filesToRemove);
          } catch (storageError) {
            console.error('Storage cleanup failed, ignoring:', storageError);
          }
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Course delete error:', error);
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Course deletion error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
