import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId');
  const courseId = url.searchParams.get('courseId');

  if (!studentId || !courseId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;
    const mentorId = decoded.sub;

    // Verify mentor owns the course
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', mentorId)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 });
    }

    // Total words in course
    const { count: totalWords } = await supabaseAdmin
      .from('vocabularies')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Learned and weak words
    const { data: progress } = await supabaseAdmin
      .from('student_vocabulary_progress')
      .select('status, mistakes_count, vocabularies!inner(course_id, german_word, translation)')
      .eq('student_id', studentId)
      .eq('vocabularies.course_id', courseId);

    const learnedCount = progress?.filter(p => p.status === 'learned').length || 0;
    const weakWords = progress?.filter(p => p.status === 'weak' || p.mistakes_count > 0)
      .sort((a, b) => b.mistakes_count - a.mistakes_count)
      .slice(0, 10) || [];

    const accuracy = totalWords ? Math.round((learnedCount / (totalWords || 1)) * 100) : 0;

    // Last activity
    const { data: lastLog } = await supabaseAdmin
      .from('user_activity_logs')
      .select('date')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Chart Data (Last 7 days words practiced)
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const { data: logs } = await supabaseAdmin
      .from('user_activity_logs')
      .select('date, words_practiced')
      .eq('student_id', studentId)
      .in('date', dates);

    const chartData = dates.map(dateStr => {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const log = logs?.find(l => l.date === dateStr);
      return {
        day: dayName,
        words: log ? log.words_practiced : 0
      };
    });

    return NextResponse.json({
      analytics: {
        totalWords: totalWords || 0,
        learnedWords: learnedCount,
        accuracy,
        weakWordsCount: progress?.filter(p => p.status === 'weak').length || 0,
        lastActivity: lastLog?.date || 'Never',
        topWeakWords: weakWords,
        chartData
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
