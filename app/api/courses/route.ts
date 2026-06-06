export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const courses = db.prepare('SELECT * FROM courses').all();
    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, credit, day, time, room, examDate, examTime } = body;
    
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 });
    }

    db.prepare(`
      INSERT OR REPLACE INTO courses (code, name, credit, day, time, room, examDate, examTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, name, credit || 3, day || '', time || '', room || '', examDate || '', examTime || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save course' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }

    db.prepare('DELETE FROM courses WHERE code = ?').run(code);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
