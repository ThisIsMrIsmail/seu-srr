import { NextResponse } from 'next/server';

export async function GET(request) {
  const userId   = Number(request.headers.get('x-user-id'));
  const username = request.headers.get('x-username') ?? '';
  const email    = request.headers.get('x-user-email') ?? '';
  const role     = request.headers.get('x-user-role') ?? '';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: userId, username, email, role },
  });
}
