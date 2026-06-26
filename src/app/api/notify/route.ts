import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bot } from '@/lib/bot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, courseId, data } = body;

    if (!type || !courseId) {
      return NextResponse.json({ error: 'Missing type or courseId' }, { status: 400 });
    }

    // 1. Find all students enrolled in this course
    const { data: members, error } = await supabaseAdmin
      .from('course_members')
      .select(`
        users (
          telegram_id,
          full_name
        )
      `)
      .eq('course_id', courseId);

    if (error || !members) {
      console.error('Failed to fetch course members:', error);
      return NextResponse.json({ error: 'Failed to fetch course members' }, { status: 500 });
    }

    // 2. Prepare message based on type
    let message = '';
    switch (type) {
      case 'vocab':
        message = `📚 *New Vocabulary added!*\nYour mentor has added new words to lesson ${data.lesson_number}.\n\nTime to learn: ${data.word}`;
        break;
      case 'homework':
        message = `📝 *New Homework: ${data.title}*\n\nReward: ${data.xp} XP\nDon&apos;t forget to submit before the deadline!`;
        break;
      case 'challenge':
        message = `🔥 *New Challenge Unlocked!*\n\n${data.title}\nComplete this quest to earn extra XP!`;
        break;
      default:
        message = `🔔 You have a new notification in StudyArena.`;
    }

    // 3. Send message to all enrolled students
    const promises = members.map(async (m: any) => {
      const telegramId = m.users?.telegram_id;
      if (telegramId) {
        try {
          await bot.api.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
        } catch (err) {
          console.error(`Failed to send message to ${telegramId}:`, err);
        }
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, notified: members.length });
  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
