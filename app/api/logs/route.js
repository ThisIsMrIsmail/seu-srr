import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// -------------------------------------------------------
// GET /api/logs
// Admin-only: returns paginated action log entries.
// Query params: page (default 1), limit (default 50),
//               userId, action, workspaceId
// -------------------------------------------------------
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page        = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit       = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const offset      = (page - 1) * limit;
  const filterUser  = searchParams.get('userId');
  const filterAction = searchParams.get('action');
  const filterWs    = searchParams.get('workspaceId');

  const conditions = [];
  const values     = [];

  if (filterUser) {
    conditions.push('l.user_id = ?');
    values.push(Number(filterUser));
  }
  if (filterAction) {
    conditions.push('l.action = ?');
    values.push(filterAction);
  }
  if (filterWs) {
    conditions.push('l.workspace_id = ?');
    values.push(filterWs);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM action_logs l ${where}`,
    values,
  );
  const total = Number(countRows[0].total);

  const [rows] = await pool.query(
    `SELECT l.id, l.user_id, l.username, l.action,
            l.workspace_id, l.student_row_id, l.details, l.created_at,
            u.email AS user_email
     FROM action_logs l
     LEFT JOIN users u ON u.id = l.user_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );

  const logs = rows.map((r) => ({
    id:           r.id,
    userId:       r.user_id,
    username:     r.username,
    userEmail:    r.user_email ?? null,
    action:       r.action,
    workspaceId:  r.workspace_id ?? null,
    studentRowId: r.student_row_id ?? null,
    details:      r.details ? parseJsonSafe(r.details) : null,
    createdAt:    new Date(r.created_at).toISOString(),
  }));

  return NextResponse.json({ logs, total, page, limit });
}

function parseJsonSafe(value) {
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return null; }
}
