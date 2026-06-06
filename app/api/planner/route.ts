export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const plannerCourses = db.prepare(`
      SELECT c.* FROM courses c
      JOIN planner_courses pc ON c.code = pc.course_code
      WHERE pc.user_id = ?
    `).all(userId);
    return NextResponse.json(plannerCourses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch planner courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const body = await request.json();
    const { courseCode } = body;
    db.prepare('INSERT OR IGNORE INTO planner_courses (user_id, course_code) VALUES (?, ?)').run(userId, courseCode);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add course to planner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    db.prepare('DELETE FROM planner_courses WHERE course_code = ? AND user_id = ?').run(courseCode, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to remove course from planner' }, { status: 500 });
  }
}
