export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { DegreeCategory, CompletedCourse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const majorRow = db.prepare("SELECT value FROM settings WHERE key = 'major' AND user_id = ?").get(userId) as { value: string } | undefined;
    const major = majorRow?.value || 'ยังไม่ได้ระบุชื่อหลักสูตร';

    const totalCreditsRow = db.prepare("SELECT value FROM settings WHERE key = 'totalCredits' AND user_id = ?").get(userId) as { value: string } | undefined;
    const totalCredits = parseInt(totalCreditsRow?.value || "0") || 0;
    
    const categories = db.prepare('SELECT * FROM degree_categories WHERE user_id = ?').all(userId) as (Omit<DegreeCategory, 'courses'> & { id: number | string })[];
    
    const categoriesWithCourses = categories.map((cat) => {
      const courses = db.prepare('SELECT course_code FROM degree_courses WHERE category_id = ? AND user_id = ?').all(cat.id, userId) as { course_code: string }[];
      return {
        ...cat,
        id: String(cat.id),
        courses: courses.map((c) => c.course_code)
      };
    });

    const completedCourses = db.prepare('SELECT course_code, grade FROM completed_courses WHERE user_id = ?').all(userId) as CompletedCourse[];

    return NextResponse.json({
      major,
      totalCredits,
      categories: categoriesWithCourses,
      completedCourses
    });
  } catch (error: any) {
    console.error('Error in GET /api/degree-plan:', error);
    return NextResponse.json({ error: 'Failed to fetch degree plan', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const body = await request.json();
    const { major, totalCredits, categories } = body;

    db.transaction(() => {
      // 1. Update Settings
      if (major !== undefined) {
        db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'major', ?)").run(userId, major);
      }
      if (totalCredits !== undefined) {
        db.prepare("INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, 'totalCredits', ?)").run(userId, String(totalCredits));
      }

      // 2. Sync Categories if provided
      if (Array.isArray(categories)) {
        console.log('[API PUT] Syncing categories. New count:', categories.length);
        
        // Identify IDs currently in DB
        const existingCats = db.prepare('SELECT id FROM degree_categories WHERE user_id = ?').all(userId) as { id: string }[];
        const existingIds = existingCats.map(c => String(c.id));
        const newIds = categories.map(c => String(c.id));

        // Delete categories removed from the list
        const toDelete = existingIds.filter(id => !newIds.includes(id));
        if (toDelete.length > 0) {
          console.log('[API PUT] Deleting orphaned categories:', toDelete);
          const deleteCourses = db.prepare('DELETE FROM degree_courses WHERE category_id = ? AND user_id = ?');
          const deleteCat = db.prepare('DELETE FROM degree_categories WHERE id = ? AND user_id = ?');
          
          for (const id of toDelete) {
            deleteCourses.run(id, userId);
            deleteCat.run(id, userId);
          }
        }

        // Upsert categories in the list
        const upsertStmt = db.prepare(`
          INSERT INTO degree_categories (user_id, id, name, required) 
          VALUES (?, ?, ?, ?) 
          ON CONFLICT(user_id, id) DO UPDATE SET 
            name = excluded.name, 
            required = excluded.required
        `);
        
        for (const cat of categories) {
          upsertStmt.run(userId, cat.id, cat.name, cat.required);
        }
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT /api/degree-plan:', error);
    return NextResponse.json({ error: 'Failed to update degree plan', details: error.message }, { status: 500 });
  }
}
