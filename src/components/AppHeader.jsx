'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspaceContext } from '../context/WorkspaceContext';

export default function AppHeader() {
  const { workspaces } = useWorkspaceContext();
  const params = useParams();

  const workspaceId = params?.id ?? null;
  const rowId = params?.rowId ?? null;

  const workspace = workspaceId
    ? (workspaces.find((w) => w.id === workspaceId) ?? null)
    : null;

  const student =
    rowId && workspace
      ? (workspace.students.find((s) => s.rowId === rowId) ?? null)
      : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-bold text-ink transition-colors hover:text-teal-700"
        >
          Reconciliation
        </Link>

        {workspace ? (
          <>
            <span className="select-none text-slate-300">/</span>
            <Link
              href={`/workspace/${workspace.id}`}
              className="max-w-[200px] truncate text-sm font-semibold text-muted transition-colors hover:text-teal-700"
            >
              {workspace.name}
            </Link>
          </>
        ) : null}

        {student ? (
          <>
            <span className="select-none text-slate-300">/</span>
            <span className="text-sm font-semibold text-ink">{student.id}</span>
          </>
        ) : null}
      </div>
    </header>
  );
}
