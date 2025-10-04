// apps/api/src/routes/profile.ts
// apps/api/src/routes/profile.ts
import type { FastifyInstance } from "fastify";
import { getTokens } from "../plugins/tokens.js";
import { fetchActivities, km, startOfISOWeek } from "../utils/strava.js";

export default async function profileRoutes(server: FastifyInstance) {
  server.get('/v1/profile', async (req, reply) => {
    const athleteId = Number((req.query as any).athlete_id);
    const t = getTokens(athleteId);
    if (!t) return reply.code(401).send({ error: 'not connected' });

    const acts = await fetchActivities(t.access_token, 180);
    const runs = acts.filter(a => a.type === 'Run');

    const byWeek = new Map<string, number>();
    for (const a of runs) {
      const d = new Date(a.start_date);
      const iso = startOfISOWeek(d).toISOString().slice(0,10);
      byWeek.set(iso, (byWeek.get(iso) ?? 0) + km(a.distance));
    }
    const weeks = [...byWeek.entries()].sort((a,b)=>a[0]<b[0]?-1:1).slice(-8).map(([,v])=>v);
    const avgWeekKm = weeks.length ? weeks.reduce((s,v)=>s+v,0)/weeks.length : 0;

    const longestRunKm = runs.reduce((m,a)=>Math.max(m, km(a.distance)), 0);

    let easy=0, thresh=0, vo2=0;
    for (const a of runs) {
      const distKm = km(a.distance);
      if (distKm < 1) continue;
      const paceMinPerKm = (a.moving_time / 60) / distKm;
      if (paceMinPerKm >= 6.0) easy += a.moving_time;
      else if (paceMinPerKm >= 4.5) thresh += a.moving_time;
      else vo2 += a.moving_time;
    }
    const total = easy+thresh+vo2 || 1;
    const intensity = { easy: easy/total, threshold: thresh/total, vo2: vo2/total };

    reply.send({
      athlete_id: athleteId,
      sample_weeks: weeks,
      avg_week_km: Number(avgWeekKm.toFixed(1)),
      longest_run_km: Math.round(longestRunKm),
      intensity_distribution: intensity
    });
  });
}
