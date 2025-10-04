// apps/api/src/server.ts
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import authRoutes from './routes/auth.js';
import activitiesRoutes from './routes/activities.js';
import profileRoutes from './routes/profile.js';

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });
server.get('/health', async () => ({ ok: true }));

await server.register(authRoutes);
await server.register(activitiesRoutes);
await server.register(profileRoutes);

const port = Number(process.env.PORT || 4000);
await server.listen({ port, host: '0.0.0.0' });
