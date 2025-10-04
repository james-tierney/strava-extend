// Server component (no 'use client')
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function Nav() {
  const cookieStore = await cookies();                      
  const athleteId = cookieStore.get('athlete_id')?.value;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-5">
        <Link href="/">Home</Link>
        <Link href="/activities">Activities</Link>
        <Link href="/plan">Plan</Link>
        <div className="ml-auto text-xs opacity-70">
          {athleteId ? `Athlete #${athleteId}` : 'Not connected'}
        </div>
      </nav>
    </header>
  );
}
