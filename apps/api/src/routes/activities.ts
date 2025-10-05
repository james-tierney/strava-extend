// apps/api/src/routes/activities.ts
// apps/api/src/routes/activities.ts
import type { FastifyInstance } from "fastify";
import axios from "axios";
import { getTokens, setTokens } from "../plugins/tokens.js";
import { refreshAccessToken } from "../utils/strava.js";

export default async function activitiesRoutes(server: FastifyInstance) {
  server.get('/activities', async (req, reply) => {
    const athleteId = Number((req.query as any).athlete_id);
    const t = getTokens(athleteId);
    if (!t) return reply.code(401).send({ error: 'not connected or token missing' });

    const now = Math.floor(Date.now() / 1000);
    let token = t.access_token;

    if (t.expires_at <= now) {
      const r = await refreshAccessToken(t.refresh_token);
      setTokens(athleteId, { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: r.expires_at });
      token = r.access_token;
    }

    const resp = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 30, page: 1 }
    });

    reply.send(resp.data);
  });
}
