import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authKey = req.headers.get('X-Admin-Key');
  if (authKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { error } = await supabaseAdmin.storage.createBucket('homework-files', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && (error as any).message !== 'The resource already exists') {
      console.error(error);
    }
    
    // Create chat bucket
    const { error: chatError } = await supabaseAdmin.storage.createBucket('chat-files', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (chatError && (chatError as any).message !== 'The resource already exists') {
      console.error(chatError);
    }

    return NextResponse.json({ success: true, message: 'Buckets created or already exist' });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
