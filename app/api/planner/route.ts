export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { data: plannerData, error: plannerError } = await supabase
      .from('planner_courses')
      .select('course_code')
      .eq('user_id', userId);

    if (plannerError) throw plannerError;
    
    if (!plannerData || plannerData.length === 0) {
      return NextResponse.json([]);
    }

    const courseCodes = plannerData.map((p: any) => p.course_code);
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('code', courseCodes);

    if (coursesError) throw coursesError;
    
    return NextResponse.json(courses || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch planner courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const body = await request.json();
    const { courseCode } = body;
    
    const { error } = await supabase.from('planner_courses').upsert({ user_id: userId, course_code: courseCode }, { onConflict: 'user_id, course_code', ignoreDuplicates: true });
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add course to planner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection not configured' }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('planner_courses')
      .delete()
      .eq('course_code', courseCode)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to remove course from planner' }, { status: 500 });
  }
}
