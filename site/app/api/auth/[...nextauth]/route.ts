import { NextRequest, NextResponse } from 'next/server';
import { handlers, authConfigured } from '../../../../auth';

export async function GET(request: NextRequest) {
  if (!authConfigured) {
    const path = new URL(request.url).pathname;
    if (path.endsWith('/providers')) return NextResponse.json({});
    if (path.endsWith('/session')) return NextResponse.json(null);
    return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 });
  }
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!authConfigured) {
    return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 });
  }
  return handlers.POST(request);
}
