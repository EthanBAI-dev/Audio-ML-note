import { NextResponse } from 'next/server';
import { recordView } from '../../../lib/views';

export async function POST(request: Request) {
  let path = '';
  try {
    path = String((await request.json() as { path?: unknown }).path ?? '');
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const views = await recordView(path);
  return NextResponse.json({ views });
}
