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
    const files = formData.getAll('files') as File[];
    const content = formData.get('content') as string;
    const description = formData.get('description') as string;

    if ((!files || files.length === 0) && !content) {
      return NextResponse.json({ error: 'Missing submission content' }, { status: 400 });
    }

    const fileUrls: string[] = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file instanceof File) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${homeworkId}_${decoded.sub}_${Date.now()}_${i}.${fileExt}`;
          
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Ensure bucket exists or update it
          try {
            await supabaseAdmin.storage.createBucket('homework-files', {
              public: true,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'],
              fileSizeLimit: 20971520 // 20MB
            });
          } catch (e) {
            try {
              await supabaseAdmin.storage.updateBucket('homework-files', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'],
                fileSizeLimit: 20971520
              });
            } catch (err) {}
          }

          const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('homework-files')
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
            .from('homework-files')
            .getPublicUrl(fileName);

          fileUrls.push(publicUrlData.publicUrl);
        }
      }
    }

    let finalContent = content;
    if (fileUrls.length > 0 || description) {
      finalContent = JSON.stringify({
        files: fileUrls,
        description: description || ''
      });
    }

    // Upsert submission
    const { data: submission, error: submitError } = await supabaseAdmin
      .from('homework_submissions')
      .upsert({
        homework_id: homeworkId,
        student_id: decoded.sub,
        content: finalContent,
        status: 'submitted',
        created_at: new Date().toISOString()
      }, { onConflict: 'homework_id,student_id' })
      .select()
      .single();

    if (submitError) throw submitError;

    // Notify mentor
    const { data: homework } = await supabaseAdmin
      .from('homeworks')
      .select('course_id, title')
      .eq('id', homeworkId)
      .single();

    if (homework) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('mentor_id, title')
        .eq('id', homework.course_id)
        .single();

      if (course) {
         // Also fetch user details for a better message
         const { data: user } = await supabaseAdmin.from('users').select('full_name').eq('id', decoded.sub).single();
         const studentName = user?.full_name || 'O\'quvchi';

         await supabaseAdmin.from('notifications').insert({
            student_id: course.mentor_id,
            title: "Vazifa topshirildi",
            message: `${studentName} "${course.title}" dagi "${homework.title}" vazifasini yubordi.`,
            type: "homework",
            related_id: homeworkId
         });
      }
    }

    return NextResponse.json({ submission }, { status: 200 });
  } catch (err: unknown) {
    console.error('Submission error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
