import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const challengeId = (await params).id;

    // Fetch challenge details
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('*, courses(title)')
      .eq('id', challengeId)
      .single();

    if (challengeError) throw challengeError;

    // Fetch submissions
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('challenge_submissions')
      .select('*, users(full_name)')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    return NextResponse.json({ challenge, submissions }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    
    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const challengeId = (await params).id;
    const body = await req.json();
    const { submissionId, status, feedback } = body; // 'graded' or 'rejected'

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Update status
    const { data: submission, error: updateError } = await supabaseAdmin
      .from('challenge_submissions')
      .update({ status, feedback: feedback || null })
      .eq('id', submissionId)
      .eq('challenge_id', challengeId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. If graded, give XP to user
    if (status === 'graded') {
      // Get challenge XP
      const { data: ch } = await supabaseAdmin.from('challenges').select('xp_reward').eq('id', challengeId).single();
      const reward = ch?.xp_reward || 0;

      const { data: user } = await supabaseAdmin.from('users').select('xp').eq('id', submission.student_id).single();
      
      if (user) {
        const newXp = (user.xp || 0) + reward;
        const newLevel = Math.floor(newXp / 10000) + 1;
        
        await supabaseAdmin.from('users').update({ xp: newXp, level: newLevel }).eq('id', submission.student_id);

        // Also add notification for student
        await supabaseAdmin.from('notifications').insert({
          user_id: submission.student_id,
          title: "Challenge Qabul Qilindi!",
          message: `Tabriklaymiz! Mentor challenge natijangizni qabul qildi va sizga +${reward} XP berildi.`,
          type: "success"
        });

        // Check for badges
        const badgesToAward = [];
        if (newXp >= 100) badgesToAward.push('xp_100');
        if (newXp >= 1000) badgesToAward.push('xp_1000');

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
              await supabaseAdmin.from('notifications').insert({
                user_id: submission.student_id,
                title: "Yangi Badge (Yutuq)!",
                message: `Tabriklaymiz! Siz "${b === 'xp_100' ? 'Tez o\'rganuvchi' : 'XP Master'}" nishonini qo'lga kiritdingiz!`,
                type: "success"
              });
            }
          }
        }
      }
    } else if (status === 'rejected') {
        // Notification for rejection
        await supabaseAdmin.from('notifications').insert({
          user_id: submission.student_id,
          title: "Challenge Qaytarildi",
          message: `Mentor challenge natijangizni qabul qilmadi. ${feedback ? `Izoh: "${feedback}"` : "Iltimos qaytadan urinib ko'ring."}`,
          type: "warning"
        });
    }

    return NextResponse.json({ success: true, submission }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
