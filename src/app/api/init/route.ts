import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.storage.createBucket('homeworks', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && (error instanceof Error ? error.message : String(error)) !== 'The resource already exists') {
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Bucket created or already exists' });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
