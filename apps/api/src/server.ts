// apps/api/src/server.ts
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import authRoutes from './routes/auth.js';
import activitiesRoutes from './routes/activities.js';
import profileRoutes from './routes/profile.js';
import planRoutes from './routes/plan.js';

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
await server.register(cookie, {});
server.get('/health', async () => ({ ok: true }));

await server.register(authRoutes);
await server.register(activitiesRoutes);
await server.register(profileRoutes);
await server.register(planRoutes);

const port = Number(process.env.PORT || 4000);
await server.listen({ port, host: '0.0.0.0' });
