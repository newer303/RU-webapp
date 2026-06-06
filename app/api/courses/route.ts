export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: courses, error } = await supabase.from('courses').select('*');
    if (error) throw error;
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

    const { error } = await supabase.from('courses').upsert({
      code,
      name,
      credit: credit || 3,
      day: day || '',
      time: time || '',
      room: room || '',
      examDate: examDate || '',
      examTime: examTime || ''
    });

    if (error) throw error;

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

    const { error } = await supabase.from('courses').delete().eq('code', code);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
