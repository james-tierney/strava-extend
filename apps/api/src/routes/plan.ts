import type { FastifyInstance } from 'fastify';
import axios from 'axios';
import { nextMonday, weeksUntil, generateBaselinePlan } from '../services/plan.js';

type GeneratePlanBody = {
  athleteId: number;
  race: { distance_km: number; date: string; goal_time_s?: number | null };
  prefs: { days_per_week: number; long_run_day?: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'; weeks?: number };
  constraints?: { max_week_km?: number; recent_injury?: boolean };
};

export default async function planRoutes(server: FastifyInstance) {
  server.post('/v1/plans/generate', async (req, reply) => {
    const body = req.body as GeneratePlanBody;
    const athleteId = body.athleteId;

    // 1) pull recent profile (we already expose /v1/profile)
    const profileRes = await axios.get(`http://localhost:${process.env.PORT || 4000}/v1/profile`, {
      params: { athlete_id: athleteId }
    });
    const profile = profileRes.data as { avg_week_km: number; longest_run_km: number };

    // 2) derive inputs
    const start = nextMonday();
    const weeks = body.prefs.weeks ?? weeksUntil(body.race.date, start);
    const baseKm = Math.max(25, Math.round((profile.avg_week_km || 30)));
    const daysPerWeek = Math.min(7, Math.max(3, body.prefs.days_per_week));
    const longRunDay = body.prefs.long_run_day ?? 'Sun';
    const maxWeekKm = body.constraints?.max_week_km ?? Math.max(45, Math.round(baseKm * 1.5));

    // 3) generate plan
    const weeksPlan = generateBaselinePlan(start, weeks, baseKm, maxWeekKm, longRunDay, daysPerWeek);

    // 4) return
    return reply.send({
      plan_id: `${athleteId}-${Date.now()}`,
      starts: start.toISOString().slice(0,10),
      meta: {
        athlete_id: athleteId,
        base_km: baseKm,
        max_week_km: maxWeekKm,
        days_per_week: daysPerWeek,
        long_run_day: longRunDay,
        race: body.race
      },
      weeks: weeksPlan
    });
  });
}
