import pool from '@/lib/db';
import { createLog } from '@/lib/logger';
import { NextResponse } from 'next/server';

// -------------------------------------------------------
// PUT /api/workspaces/[id]/manual-selections
// Upsert a student's manual course selection.
//
// Body: {
//   rowId:              string,
//   selectedCourseKeys: string[],
//   reviewedAt:         string | null,
//   lastEditedAt:       string | null,
// }
// -------------------------------------------------------
export async function PUT(request, { params }) {
  const userId   = Number(request.headers.get('x-user-id'));
  const username = request.headers.get('x-username') ?? '';
  const { id }   = await params;

  const body = await request.json().catch(() => null);
  if (!body?.rowId) {
    return NextResponse.json({ error: 'rowId is required.' }, { status: 400 });
  }

  // Ensure the workspace belongs to the current user
  const [ownerCheck] = await pool.query(
    'SELECT id FROM workspaces WHERE id = ? AND created_by = ?',
    [id, userId],
  );
  if (!ownerCheck[0]) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const { rowId, selectedCourseKeys, reviewedAt, lastEditedAt } = body;

  const reviewedAtValue   = reviewedAt   ? new Date(reviewedAt)   : null;
  const lastEditedAtValue = lastEditedAt ? new Date(lastEditedAt) : null;

  await pool.query(
    `INSERT INTO manual_selections
       (workspace_id, row_id, selected_course_keys, reviewed_at, last_edited_at, reviewed_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       selected_course_keys = VALUES(selected_course_keys),
       reviewed_at          = VALUES(reviewed_at),
       last_edited_at       = VALUES(last_edited_at),
       reviewed_by          = VALUES(reviewed_by)`,
    [
      id,
      String(rowId),
      JSON.stringify(Array.isArray(selectedCourseKeys) ? selectedCourseKeys : []),
      reviewedAtValue,
      lastEditedAtValue,
      reviewedAt ? userId : null,
    ],
  );

  // Touch the workspace updated_at
  await pool.query(
    'UPDATE workspaces SET updated_at = NOW() WHERE id = ?',
    [id],
  );

  const action = reviewedAt ? 'save_review' : 'edit_selection';
  await createLog(userId, username, action, {
    workspaceId: id,
    studentRowId: rowId,
  });

  return NextResponse.json({ ok: true });
}

// -------------------------------------------------------
// DELETE /api/workspaces/[id]/manual-selections/[rowId]
// Remove a student's review (reset).
// Note: rowId is passed as a query parameter here because
// Next.js App Router doesn't support optional catch-all
// segments in the same file; see the [rowId] route file.
// -------------------------------------------------------
export async function DELETE(request, { params }) {
  const userId   = Number(request.headers.get('x-user-id'));
  const username = request.headers.get('x-username') ?? '';
  const { id }   = await params;

  const { searchParams } = new URL(request.url);
  const rowId = searchParams.get('rowId');

  if (!rowId) {
    return NextResponse.json({ error: 'rowId query parameter is required.' }, { status: 400 });
  }

  const [ownerCheck] = await pool.query(
    'SELECT id FROM workspaces WHERE id = ? AND created_by = ?',
    [id, userId],
  );
  if (!ownerCheck[0]) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  await pool.query(
    'DELETE FROM manual_selections WHERE workspace_id = ? AND row_id = ?',
    [id, rowId],
  );

  await pool.query('UPDATE workspaces SET updated_at = NOW() WHERE id = ?', [id]);

  await createLog(userId, username, 'reset_review', {
    workspaceId: id,
    studentRowId: rowId,
  });

  return NextResponse.json({ ok: true });
}
