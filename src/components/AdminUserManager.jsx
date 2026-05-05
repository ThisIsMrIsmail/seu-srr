'use client';

import { useCallback, useEffect, useState } from 'react';

const ROLE_LABELS = { admin: 'Admin', user: 'User' };

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return '—'; }
}

// -------------------------------------------------------
// User Management panel
// -------------------------------------------------------
export function UserManager() {
  const [users,     setUsers]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'user',
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Failed to create user.'); return; }
      setForm({ username: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      await loadUsers();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    await fetch(`/api/admin/users/${user.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !user.isActive }),
    });
    await loadUsers();
  }

  async function resetPassword(user) {
    const newPwd = window.prompt(`New password for "${user.username}" (min 8 chars):`);
    if (!newPwd) return;
    if (newPwd.length < 8) { alert('Password must be at least 8 characters.'); return; }
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: newPwd }),
    });
    if (res.ok) alert('Password updated successfully.');
    else alert('Failed to update password.');
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) await loadUsers();
    else alert('Failed to delete user.');
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Users</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setShowForm((v) => !v); setFormError(''); }}
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
          {formError && (
            <p className="col-span-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Username</label>
            <input
              required type="text" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input-field w-full" placeholder="john.doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Email</label>
            <input
              required type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field w-full" placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Password</label>
            <input
              required type="password" value={form.password} minLength={8}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field w-full" placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-field w-full"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted">Loading users...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 text-left">Username</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Created</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-ink">{u.username}</td>
                  <td className="px-4 py-2.5 text-muted">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={[
                      'rounded-[8px] px-2 py-0.5 text-xs font-semibold',
                      u.role === 'admin'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-600',
                    ].join(' ')}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={[
                      'rounded-[8px] px-2 py-0.5 text-xs font-semibold',
                      u.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600',
                    ].join(' ')}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleActive(u)}
                        className="rounded-[8px] px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetPassword(u)}
                        className="rounded-[8px] px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Reset pw
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(u)}
                        className="rounded-[8px] px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// Activity logs panel
// -------------------------------------------------------
const ACTION_LABELS = {
  login:               'Login',
  logout:              'Logout',
  create_workspace:    'Created workspace',
  delete_workspace:    'Deleted workspace',
  save_review:         'Saved review',
  reset_review:        'Reset review',
  edit_selection:      'Edited selection',
  export:              'Exported report',
  admin_create_user:   'Created user',
  admin_update_user:   'Updated user',
  admin_delete_user:   'Deleted user',
};

export function ActivityLogs() {
  const [logs,      setLogs]      = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const LIMIT = 50;

  const loadLogs = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/logs?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch {
      setError('Failed to load logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(1); }, [loadLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Activity Logs</h2>
        <span className="text-xs text-muted">{total} total entries</span>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted">Loading logs...</p>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 text-left">Time</th>
                  <th className="px-4 py-2.5 text-left">User</th>
                  <th className="px-4 py-2.5 text-left">Action</th>
                  <th className="px-4 py-2.5 text-left">Workspace</th>
                  <th className="px-4 py-2.5 text-left">Student row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 font-medium text-ink">{log.username}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-[8px] bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted font-mono">
                      {log.workspaceId ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted">
                      {log.studentRowId ?? '—'}
                    </td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                      No log entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => loadLogs(page - 1)}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => loadLogs(page + 1)}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
