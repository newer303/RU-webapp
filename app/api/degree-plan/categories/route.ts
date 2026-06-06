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
    const { id, name, required } = body;
    
    // Use UPSERT instead of REPLACE to avoid triggering ON DELETE CASCADE
    db.prepare(`
      INSERT INTO degree_categories (user_id, id, name, required) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(user_id, id) DO UPDATE SET 
        name = excluded.name, 
        required = excluded.required
    `).run(userId, id, name, required);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add/update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'global';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    console.log('[API DELETE] Processing deletion for ID:', id);
    
    let changes = 0;
    
    // Run in a block to ensure we try both string and numeric if needed
    const performDelete = (targetId: string | number) => {
      // 1. Clear courses first (manual cascade)
      db.prepare('DELETE FROM degree_courses WHERE category_id = ? AND user_id = ?').run(targetId, userId);
      // 2. Delete the category
      const result = db.prepare('DELETE FROM degree_categories WHERE id = ? AND user_id = ?').run(targetId, userId);
      return result.changes;
    };

    changes = performDelete(id);
    
    // If no rows deleted and ID is numeric string, try numeric type
    if (changes === 0 && /^\d+$/.test(id)) {
      console.log('[API DELETE] Retrying with numeric cast for:', id);
      changes = performDelete(Number(id));
    }

    console.log(`[API DELETE] Deletion completed. Rows affected: ${changes}`);
    return NextResponse.json({ success: true, changes });
  } catch (error: any) {
    console.error('[API DELETE] Critical Error:', error);
    return NextResponse.json({ error: 'Failed to delete category', details: error.message }, { status: 500 });
  }
}
