'use client';

import { useEffect, useMemo, useState } from 'react';

type WeekPlan = {
  week_index: number;
  target_km: number;
  cutback: boolean;
  workouts: { date: string; type: string; desc: string }[];
};
type PlanResp = {
  starts: string;
  meta: any;
  weeks: WeekPlan[];
};

export default function PlanPage() {
  const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const athleteId = params.get('athlete_id');

  const [raceDistance, setRaceDistance] = useState(42.195);
  const [raceDate, setRaceDate] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [longRunDay, setLongRunDay] = useState('Sun');
  const [weeksOverride, setWeeksOverride] = useState<number | ''>('');
  const [maxWeekKm, setMaxWeekKm] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(); d.setDate(d.getDate()+84);
    setRaceDate(d.toISOString().slice(0,10));
  }, []);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!athleteId) { setError('Missing athlete_id'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('http://localhost:4000/v1/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: Number(athleteId),
          race: { distance_km: Number(raceDistance), date: raceDate },
          prefs: {
            days_per_week: Number(daysPerWeek),
            long_run_day: longRunDay as any,
            weeks: weeksOverride ? Number(weeksOverride) : undefined
          },
          constraints: { max_week_km: maxWeekKm ? Number(maxWeekKm) : undefined }
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setPlan(await res.json());
    } catch (err:any) {
      setError(err.message ?? 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Build Your Training Plan</h1>

        <form onSubmit={onGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div>
            <label className="block text-sm mb-1">Race Distance</label>
            <select value={raceDistance} onChange={e=>setRaceDistance(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2">
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={21.0975}>Half Marathon</option>
              <option value={42.195}>Marathon</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Race Date</label>
            <input type="date" value={raceDate} onChange={e=>setRaceDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Days / Week</label>
            <input type="number" min={3} max={7} value={daysPerWeek} onChange={e=>setDaysPerWeek(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Long Run Day</label>
            <select value={longRunDay} onChange={e=>setLongRunDay(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Override Weeks (optional)</label>
            <input type="number" min={6} max={20} value={weeksOverride as number || ''} onChange={e=>setWeeksOverride(e.target.value?Number(e.target.value):'')} className="w-full bg-slate-900 border border-slate-700 rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Max Weekly km (optional)</label>
            <input type="number" min={20} max={200} value={maxWeekKm as number || ''} onChange={e=>setMaxWeekKm(e.target.value?Number(e.target.value):'')} className="w-full bg-slate-900 border border-slate-700 rounded p-2"/>
          </div>
          <div className="md:col-span-3">
            <button disabled={loading} className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50">Generate Plan</button>
            {error && <span className="ml-4 text-red-400">{error}</span>}
          </div>
        </form>

        {loading && <div>Generating…</div>}

        {plan && (
          <div className="space-y-4">
            <div className="text-sm text-slate-300">
              Starts {plan.starts}. Target days/week: {plan.meta.days_per_week}. Long run: {plan.meta.long_run_day}. Base {plan.meta.base_km}km.
            </div>
            {plan.weeks.map(w => (
              <div key={w.week_index} className="rounded-xl border border-slate-700 bg-slate-800">
                <div className="flex items-center justify-between p-3 border-b border-slate-700">
                  <div className="font-medium">Week {w.week_index}{w.cutback ? ' · Cutback' : ''}</div>
                  <div className="text-sm text-slate-300">Target: {w.target_km} km</div>
                </div>
                <div className="divide-y divide-slate-700">
                  {w.workouts.map(wo => (
                    <div key={wo.date+wo.desc} className="flex items-center justify-between px-3 py-2">
                      <div className="text-slate-200 w-28">{wo.date}</div>
                      <div className="uppercase text-xs w-24 opacity-80">{wo.type}</div>
                      <div className="flex-1">{wo.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
