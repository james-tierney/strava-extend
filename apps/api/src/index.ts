import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import axios from 'axios';

type TokenBundle = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
};

// ⚠️ MVP only: in-memory store (use DB later)
const TOKENS = new Map<number, TokenBundle>(); // key: athlete.id

const server = Fastify({ logger: true });
await server.register(cors, { origin: true });

server.get('/health', async () => ({ ok: true }));

// 1) Start Strava OAuth
server.get('/auth/strava/start', async (_req, reply) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!, // http://localhost:4000/auth/strava/callback
    response_type: 'code',
    scope: 'read,activity:read_all,profile:read_all',
    approval_prompt: 'auto'
  });
  reply.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

// 2) OAuth callback → exchange code for tokens, store, redirect to web
server.get('/auth/strava/callback', async (req, reply) => {
  const code = (req.query as any).code as string;
  if (!code) return reply.code(400).send({ error: 'missing code' });

  const r = await axios.post('https://www.strava.com/oauth/token', {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code'
  });

  const athleteId = r.data.athlete?.id as number;
  TOKENS.set(athleteId, {
    access_token: r.data.access_token,
    refresh_token: r.data.refresh_token,
    expires_at: r.data.expires_at
  });

  // Redirect to web to show activities
  reply.redirect(`http://localhost:3000/activities?athlete_id=${athleteId}`);
});

// 3) Return recent activities for athlete_id using stored access token
server.get('/activities', async (req, reply) => {
  const athleteId = Number((req.query as any).athlete_id);
  const t = TOKENS.get(athleteId);
  if (!t) return reply.code(401).send({ error: 'not connected or token missing' });

  // (Optional) Refresh if expired
  const now = Math.floor(Date.now() / 1000);
  if (t.expires_at <= now) {
    const rr = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token
    });
    TOKENS.set(athleteId, {
      access_token: rr.data.access_token,
      refresh_token: rr.data.refresh_token,
      expires_at: rr.data.expires_at
    });
  }

  const token = TOKENS.get(athleteId)!.access_token;

  const resp = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 30, page: 1 }
  });

  reply.send(resp.data);
});

const port = Number(process.env.PORT || 4000);
await server.listen({ port, host: '0.0.0.0' });
