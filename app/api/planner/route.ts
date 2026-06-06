export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { data: plannerCourses, error } = await supabase
      .from('planner_courses')
      .select(`
        courses (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Flatten the join result
    const flattened = plannerCourses?.map((pc: any) => pc.courses).filter(Boolean) || [];
    
    return NextResponse.json(flattened);
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
    
    const { error } = await supabase.from('planner_courses').upsert({ user_id: userId, course_code: courseCode }, { onConflict: 'user_id, course_code', ignoreDuplicates: true });
    if (error) throw error;
    
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
