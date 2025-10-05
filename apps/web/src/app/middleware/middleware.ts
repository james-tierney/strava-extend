import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const athleteId = req.cookies.get('athlete_id')?.value;

  const isAuthedRoute = url.pathname.startsWith('/activities') || url.pathname.startsWith('/plan') || url.pathname.startsWith('/settings');

  if (isAuthedRoute && !athleteId) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
