import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';
import { submissionGradeSchema } from '@/lib/validations';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    const submissionId = (await params).id;
    const body = await req.json();
    const parsed = submissionGradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { status, score, feedback } = parsed.data;

    // Verify ownership
    const { data: submission, error: subError } = await supabaseAdmin
      .from('homework_submissions')
      .select('*, homeworks(*, courses(*))')
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.homeworks.courses.mentor_id !== decoded.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update submission
    const { error: updateError } = await supabaseAdmin
      .from('homework_submissions')
      .update({
        status,
        feedback: feedback || null,
        score: score !== undefined ? score : submission.homeworks.xp_reward
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // If approved, add XP to student
    if (status === 'graded') {
      const awardedScore = score !== undefined ? score : submission.homeworks.xp_reward;
      
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('xp, telegram_id')
        .eq('id', submission.student_id)
        .single();

      if (student) {
        const newXp = (student.xp || 0) + awardedScore;
        const newLevel = Math.floor(newXp / 10000) + 1;
        await supabaseAdmin
          .from('users')
          .update({ xp: newXp, level: newLevel })
          .eq('id', submission.student_id);

        await supabaseAdmin.from('notifications').insert({
          user_id: submission.student_id,
          title: "Vazifa Qabul Qilindi!",
          message: `Tabriklaymiz! Mentor vazifangizni qabul qildi va sizga +${awardedScore} XP berildi.`,
          type: "homework"
        });

        // Send Telegram notification
        if (student.telegram_id) {
          await sendTelegramMessage(
            student.telegram_id,
            `✅ <b>Vazifa qabul qilindi!</b>\n\nTabriklaymiz! Mentor vazifangizni qabul qildi va sizga <b>+${awardedScore} XP</b> berildi.`
          );
        }

        // Check for badges
        const badgesToAward = [];
        if (newXp >= 100) badgesToAward.push('xp_100');
        if (newXp >= 500) badgesToAward.push('xp_500');
        if (newXp >= 1000) badgesToAward.push('xp_1000');
        if (newXp >= 5000) badgesToAward.push('xp_5000');

        if (badgesToAward.length > 0) {
          const { data: existingBadges } = await supabaseAdmin
            .from('user_badges')
            .select('badge_type')
            .eq('student_id', submission.student_id)
            .in('badge_type', badgesToAward);
            
          const existingSet = new Set((existingBadges || []).map(b => b.badge_type));
          const newBadges = badgesToAward.filter(b => !existingSet.has(b));
          
          if (newBadges.length > 0) {
            const inserts = newBadges.map(b => ({
              student_id: submission.student_id,
              badge_type: b
            }));
            await supabaseAdmin.from('user_badges').insert(inserts);

            for (const b of newBadges) {
              let bName = 'Yutuq';
              if (b === 'xp_100') bName = 'Tez o\'rganuvchi';
              if (b === 'xp_500') bName = 'O\'sib borayotgan yulduz';
              if (b === 'xp_1000') bName = 'XP Master';
              if (b === 'xp_5000') bName = 'XP Əfsanasi';

              await supabaseAdmin.from('notifications').insert({
                user_id: submission.student_id,
                title: "Yangi Badge (Yutuq)!",
                message: `Tabriklaymiz! Siz "${bName}" nishonini qo'lga kiritdingiz!`,
                type: "challenge" // Using 'challenge' as a general 'achievement' category to go to profile
              });

              if (student.telegram_id) {
                await sendTelegramMessage(
                  student.telegram_id,
                  `🏆 <b>Yangi Badge!</b>\n\nTabriklaymiz! Siz <b>"${bName}"</b> nishonini qo'lga kiritdingiz!`
                );
              }
            }
          }
        }
      }
    } else if (status === 'rejected') {
      await supabaseAdmin.from('notifications').insert({
        user_id: submission.student_id,
        title: "Vazifa Qaytarildi",
        message: `Mentor vazifangizni qabul qilmadi. ${feedback ? `Izoh: "${feedback}"` : "Iltimos qaytadan urinib ko'ring."}`,
        type: "homework"
      });

      // Get student's telegram_id
      const { data: student } = await supabaseAdmin.from('users').select('telegram_id').eq('id', submission.student_id).single();
      if (student?.telegram_id) {
        await sendTelegramMessage(
          student.telegram_id,
          `❌ <b>Vazifa qaytarildi!</b>\n\nMentor vazifangizni qabul qilmadi.\n${feedback ? `Izoh: <i>"${feedback}"</i>` : "Iltimos qaytadan urinib ko'ring."}`
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Grading error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
