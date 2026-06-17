import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bot } from '@/lib/bot';

// This endpoint should be protected in production (e.g., verifying Vercel CRON headers)
export async function GET(req: Request) {
  try {
    // Find all students who haven't completed a lesson today or need a reminder
    // For this prototype, we'll send a reminder to all active students
    const { data: students, error } = await supabaseAdmin
      .from('users')
      .select('telegram_id, full_name, streak')
      .eq('role', 'student');

    if (error || !students) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    const promises = students.map(async (student: any) => {
      const telegramId = student.telegram_id;
      if (telegramId) {
        let message = `Hey ${student.full_name?.split(' ')[0]}! 👋\n\nIt's time for your daily learning session! Keep your 🔥 ${student.streak} day streak alive!`;
        
        try {
          await bot.api.sendMessage(telegramId, message);
        } catch (err) {
          console.error(`Failed to send daily reminder to ${telegramId}:`, err);
        }
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, notified: students.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
