import pool from '@/lib/db';
import { createLog } from '@/lib/logger';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

// -------------------------------------------------------
// PUT /api/admin/users/[id]  –  update user (role / active / password)
// -------------------------------------------------------
export async function PUT(request, { params }) {
  const adminId   = Number(request.headers.get('x-user-id'));
  const adminName = request.headers.get('x-username') ?? '';
  const { id }    = await params;
  const targetId  = Number(id);

  const body = await request.json().catch(() => null);
  const { role, isActive, password } = body ?? {};

  const updates = [];
  const values  = [];

  if (role !== undefined) {
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }
    updates.push('role = ?');
    values.push(role);
  }

  if (isActive !== undefined) {
    // Prevent the current admin from deactivating themselves
    if (!isActive && targetId === adminId) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account.' },
        { status: 400 },
      );
    }
    updates.push('is_active = ?');
    values.push(isActive ? 1 : 0);
  }

  if (password !== undefined) {
    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }
    updates.push('password_hash = ?');
    values.push(await hash(String(password), 12));
  }

  if (!updates.length) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  values.push(targetId);
  const [result] = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  await createLog(adminId, adminName, 'admin_update_user', {
    details: { targetUserId: targetId, changes: Object.keys(body ?? {}) },
  });

  return NextResponse.json({ ok: true });
}

// -------------------------------------------------------
// DELETE /api/admin/users/[id]  –  delete a user account
// -------------------------------------------------------
export async function DELETE(request, { params }) {
  const adminId   = Number(request.headers.get('x-user-id'));
  const adminName = request.headers.get('x-username') ?? '';
  const { id }    = await params;
  const targetId  = Number(id);

  if (targetId === adminId) {
    return NextResponse.json(
      { error: 'You cannot delete your own account.' },
      { status: 400 },
    );
  }

  // Get user info before deleting (for the log)
  const [rows] = await pool.query('SELECT username FROM users WHERE id = ?', [targetId]);
  if (!rows[0]) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  await pool.query('DELETE FROM users WHERE id = ?', [targetId]);

  await createLog(adminId, adminName, 'admin_delete_user', {
    details: { deletedUserId: targetId, deletedUsername: rows[0].username },
  });

  return NextResponse.json({ ok: true });
}
