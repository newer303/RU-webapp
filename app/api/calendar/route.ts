export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
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

    const { data, error } = await supabase
      .from('events')
      .insert({ user_id: userId, title, startDate, endDate, type, region, dateStr, sendNotify })
      .select('id')
      .single();

    if (error) throw error;

    if (sendNotify) {
      const baseUrl = new URL(request.url).origin;
      await fetch(`${baseUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `\n🔔 กิจกรรมใหม่: ${title}\n📅 วันที่: ${dateStr}` })
      }).catch(err => console.error('Failed to send auto notification:', err));
    }

    return NextResponse.json({ id: data.id });
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

    const { error } = await supabase
      .from('events')
      .update({ title, startDate, endDate, type, region, dateStr, sendNotify })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

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

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
