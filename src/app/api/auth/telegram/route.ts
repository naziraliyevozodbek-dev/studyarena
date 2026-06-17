import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    // Parse initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Create data check string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Validate hash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hash !== expectedHash) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
    }

    // Get user data
    const userStr = urlParams.get('user');
    if (!userStr) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    const telegramUser = JSON.parse(userStr);

    // Upsert user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          telegram_id: telegramUser.id,
          full_name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
          username: telegramUser.username,
          avatar_url: telegramUser.photo_url,
          // role defaults to 'student' in db schema
        },
        { onConflict: 'telegram_id' }
      )
      .select()
      .single();

    if (error || !user) {
      console.error('Error upserting user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Generate Supabase Custom JWT
    const token = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
        sub: user.id,
        role: 'authenticated',
        user_role: user.role,
      },
      process.env.SUPABASE_JWT_SECRET!
    );

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
