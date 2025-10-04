// apps/api/src/routes/auth.ts
// apps/api/src/routes/auth.ts
import type { FastifyInstance } from "fastify";
import { exchangeCodeForTokens } from "../utils/strava.js";
import { setTokens } from "../plugins/tokens.js";

export default async function authRoutes(server: FastifyInstance) {
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

    server.get('/auth/strava/callback', async (req, reply) => {
    const code = (req.query as any).code as string;
    if (!code) return reply.code(400).send({ error: 'missing code' });

    const data = await exchangeCodeForTokens(code);

    setTokens(data.athlete.id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
    });

    const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:3000';

    // set cookie + redirect
    reply
        .setCookie('athlete_id', String(data.athlete.id), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
        })
        .redirect(`${WEB_ORIGIN}/plan`);
    });

}
