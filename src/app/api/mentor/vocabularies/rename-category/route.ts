import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    if (decoded.role !== 'mentor') {
      return NextResponse.json({ error: 'Faqat mentorlar tahrirlay oladi' }, { status: 403 });
    }

    const { courseId, oldCategory, newCategory } = await req.json();

    if (!courseId || !oldCategory || !newCategory) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi shart' }, { status: 400 });
    }

    // Since we use the category column to group, we need to update all vocabularies in this course with this old category
    let updateQuery = supabaseAdmin
      .from('vocabularies')
      .update({ category: newCategory })
      .eq('course_id', courseId);
      
    if (oldCategory === "Asosiy so'zlar") {
      updateQuery = updateQuery.is('category', null);
    } else {
      updateQuery = updateQuery.eq('category', oldCategory);
    }

    const { error } = await updateQuery;

    if (error) {
      console.error(error);
      throw new Error("Nomini o'zgartirishda xatolik yuz berdi");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
