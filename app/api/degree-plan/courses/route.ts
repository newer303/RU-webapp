export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const body = await request.json();
    const { categoryId, courseCode } = body;
    
    // Ensure course exists in courses table (shared)
    db.prepare('INSERT OR IGNORE INTO courses (code, name, credit) VALUES (?, ?, ?)').run(courseCode, 'ไม่ระบุชื่อวิชา', 3);
    
    db.prepare('INSERT INTO degree_courses (user_id, category_id, course_code) VALUES (?, ?, ?)').run(userId, categoryId, courseCode);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add course to category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const courseCode = searchParams.get('courseCode');
    
    if (!categoryId || !courseCode) return NextResponse.json({ error: 'categoryId and courseCode are required' }, { status: 400 });
    
    db.prepare('DELETE FROM degree_courses WHERE category_id = ? AND course_code = ? AND user_id = ?').run(categoryId, courseCode, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete course from category' }, { status: 500 });
  }
}
