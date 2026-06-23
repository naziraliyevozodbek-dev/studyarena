import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const homeworkId = (await params).id;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const content = formData.get('content') as string;

    if (!file && !content) {
      return NextResponse.json({ error: 'Missing submission content' }, { status: 400 });
    }

    let fileUrl = null;

    if (file) {
      // Upload to Supabase Storage using admin client
      const fileExt = file.name.split('.').pop();
      const fileName = `${homeworkId}_${decoded.sub}_${Date.now()}.${fileExt}`;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('homeworks')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw new Error('File upload failed');
      }

      const { data: publicUrlData } = supabaseAdmin
        .storage
        .from('homeworks')
        .getPublicUrl(fileName);

      fileUrl = publicUrlData.publicUrl;
    }

    // Upsert submission
    const { data: submission, error: submitError } = await supabaseAdmin
      .from('homework_submissions')
      .upsert({
        homework_id: homeworkId,
        student_id: decoded.sub,
        content: fileUrl ? fileUrl : content,
        status: 'submitted',
        created_at: new Date().toISOString()
      }, { onConflict: 'homework_id,student_id' })
      .select()
      .single();

    if (submitError) throw submitError;

    return NextResponse.json({ submission }, { status: 200 });
  } catch (err: any) {
    console.error('Submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
