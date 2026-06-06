export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';
    
    const events = db.prepare('SELECT * FROM events WHERE user_id = ?').all(userId);
    return NextResponse.json(events);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';
    
    const body = await request.json();
    const { title, startDate, endDate, type, region, dateStr, sendNotify } = body;

    const info = db.prepare(
      'INSERT INTO events (user_id, title, startDate, endDate, type, region, dateStr) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, title, startDate, endDate, type, region, dateStr);

    if (sendNotify) {
      // Trigger internal notify API
      const baseUrl = new URL(request.url).origin;
      await fetch(`${baseUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `\n🔔 กิจกรรมใหม่: ${title}\n📅 วันที่: ${dateStr}` })
      }).catch(err => console.error('Failed to send auto notification:', err));
    }

    return NextResponse.json({ id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';
    
    const body = await request.json();
    const { id, title, startDate, endDate, type, region, dateStr, sendNotify } = body;

    db.prepare(
      'UPDATE events SET title = ?, startDate = ?, endDate = ?, type = ?, region = ?, dateStr = ? WHERE id = ? AND user_id = ?'
    ).run(title, startDate, endDate, type, region, dateStr, id, userId);

    if (sendNotify) {
      const baseUrl = new URL(request.url).origin;
      await fetch(`${baseUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `\n🔔 อัปเดตกิจกรรม: ${title}\n📅 วันที่: ${dateStr}` })
      }).catch(err => console.error('Failed to send auto notification:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
