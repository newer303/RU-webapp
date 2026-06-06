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
    
    // Batch Mode
    if (body.courses && Array.isArray(body.courses)) {
      const insert = db.prepare('INSERT OR REPLACE INTO completed_courses (user_id, course_code, grade) VALUES (?, ?, ?)');
      const transaction = db.transaction((courses) => {
        for (const c of courses) {
          insert.run(userId, c.code, c.grade || null);
        }
      });
      transaction(body.courses);
      return NextResponse.json({ success: true, count: body.courses.length });
    }

    // Single Mode
    const { courseCode, completed, grade } = body;
    
    if (completed) {
      db.prepare('INSERT OR REPLACE INTO completed_courses (user_id, course_code, grade) VALUES (?, ?, ?)').run(userId, courseCode, grade || null);
    } else {
      db.prepare('DELETE FROM completed_courses WHERE course_code = ? AND user_id = ?').run(courseCode, userId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update completed course' }, { status: 500 });
  }
}
