import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bot } from '@/lib/bot';

export async function GET(req: Request) {
  try {
    // Fetch top 3 students from the leaderboard view
    const { data: topStudents, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .limit(3);

    if (error || !topStudents) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    if (topStudents.length === 0) {
      return NextResponse.json({ success: true, message: 'No students found' });
    }

    let leaderboardMessage = `🏆 *Weekly Leaderboard Results!* 🏆\n\n`;
    topStudents.forEach((student: any) => {
      let medal = student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉';
      leaderboardMessage += `${medal} ${student.full_name} - ${student.total_xp} XP\n`;
    });

    leaderboardMessage += `\nKeep studying to climb the ranks next week! 💪`;

    // Fetch all students to announce
    const { data: students } = await supabaseAdmin
      .from('users')
      .select('telegram_id')
      .eq('role', 'student');

    if (students) {
      const promises = students.map(async (student: any) => {
        const telegramId = student.telegram_id;
        if (telegramId) {
          try {
            await bot.api.sendMessage(telegramId, leaderboardMessage, { parse_mode: 'Markdown' });
          } catch (err) {
            console.error(`Failed to send weekly update to ${telegramId}:`, err);
          }
        }
      });
      await Promise.all(promises);
    }

    return NextResponse.json({ success: true, notified: students?.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
