import { webhookCallback } from 'grammy';
import { bot } from '@/lib/bot';
import { NextResponse } from 'next/server';

// We use grammy's webhookCallback adapter for standard web standards (Next.js Request/Response)
const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(req: Request) {
  try {
    await handleUpdate(req);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to process webhook' }, { status: 500 });
  }
}

// To set this webhook in Telegram, you must visit:
// https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/bot/webhook
