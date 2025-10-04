'use client';

import { useEffect, useState } from 'react';
import { useAthleteId } from '../hooks/useAthleteId';

type Activity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date_local: string;
  type: string;
};

function mToKm(m: number) { return (m / 1000).toFixed(2); }
function sToHMS(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function ActivitiesPage() {
  const athleteId = useAthleteId();
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (athleteId === null) return; // waiting for cookie
    if (!athleteId) { setError('Not connected'); setLoading(false); return; }

    (async () => {
      try {
        const res = await fetch(`${API}/activities?athlete_id=${athleteId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`API ${res.status}`);
        setData(await res.json());
      } catch (e: any) {
        setError(e.message ?? 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    })();
  }, [athleteId]);

  if (athleteId === null) return <main className="p-8">Loading…</main>;
  if (loading) return <main className="p-8">Loading activities…</main>;
  if (error) return <main className="p-8 text-red-400">Error: {error}</main>;

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Your Recent Activities</h1>
        <div className="rounded-2xl border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-700 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold text-right">Distance (km)</th>
                  <th className="p-3 font-semibold text-right">Moving Time</th>
                  <th className="p-3 font-semibold text-right">Elevation (m)</th>
                </tr>
              </thead>
              <tbody>
                {data.map(a => (
                  <tr key={a.id} className="odd:bg-slate-800 even:bg-slate-900">
                    <td className="p-3 whitespace-nowrap">{new Date(a.start_date_local).toLocaleString()}</td>
                    <td className="p-3">{a.name}</td>
                    <td className="p-3">{a.type}</td>
                    <td className="p-3 text-right">{mToKm(a.distance)}</td>
                    <td className="p-3 text-right">{sToHMS(a.moving_time)}</td>
                    <td className="p-3 text-right">{Math.round(a.total_elevation_gain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
