import pool from '@/lib/db';
import { createLog } from '@/lib/logger';
import { NextResponse } from 'next/server';

function parseJsonSafe(value, fallback) {
  if (typeof value === 'object' && value !== null) return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

// -------------------------------------------------------
// GET /api/workspaces/[id]
// -------------------------------------------------------
export async function GET(request, { params }) {
  const userId      = Number(request.headers.get('x-user-id'));
  const { id }      = await params;

  const [rows] = await pool.query(
    `SELECT id, name, file_name, students, subject_columns, export_columns,
            header_rows, created_by, created_at, updated_at
     FROM workspaces WHERE id = ? AND created_by = ?`,
    [id, userId],
  );

  const w = rows[0];
  if (!w) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const [selRows] = await pool.query(
    `SELECT row_id, selected_course_keys, reviewed_at, last_edited_at
     FROM manual_selections WHERE workspace_id = ?`,
    [id],
  );

  const manualSelections = {};
  for (const sel of selRows) {
    manualSelections[sel.row_id] = {
      selectedCourseKeys: parseJsonSafe(sel.selected_course_keys, []),
      reviewedAt:   sel.reviewed_at ? new Date(sel.reviewed_at).toISOString() : null,
      lastEditedAt: sel.last_edited_at ? new Date(sel.last_edited_at).toISOString() : null,
    };
  }

  return NextResponse.json({
    workspace: {
      id:             w.id,
      name:           w.name,
      fileName:       w.file_name,
      students:       parseJsonSafe(w.students, []),
      subjectColumns: parseJsonSafe(w.subject_columns, []),
      exportColumns:  parseJsonSafe(w.export_columns, []),
      headerRows:     parseJsonSafe(w.header_rows, []),
      manualSelections,
      searchQuery:    '',
      selectedStudentRowId: null,
      createdAt:  new Date(w.created_at).toISOString(),
      updatedAt:  new Date(w.updated_at).toISOString(),
    },
  });
}

// -------------------------------------------------------
// DELETE /api/workspaces/[id]
// -------------------------------------------------------
export async function DELETE(request, { params }) {
  const userId   = Number(request.headers.get('x-user-id'));
  const username = request.headers.get('x-username') ?? '';
  const { id }   = await params;

  const [check] = await pool.query(
    'SELECT id FROM workspaces WHERE id = ? AND created_by = ?',
    [id, userId],
  );

  if (!check[0]) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  // manual_selections cascade-deleted via FK
  await pool.query('DELETE FROM workspaces WHERE id = ? AND created_by = ?', [id, userId]);

  await createLog(userId, username, 'delete_workspace', { workspaceId: id });

  return NextResponse.json({ ok: true });
}
