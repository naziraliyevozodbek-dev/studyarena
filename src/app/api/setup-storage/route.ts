import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authKey = req.headers.get('X-Admin-Key');
  if (authKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    // Create bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('homework-files', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && (error instanceof Error ? error.message : String(error)) !== 'The resource already exists') {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Bucket created or already exists' });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
