import Fastify from 'fastify';
import { state } from './app.js';

const fastify = Fastify({ logger: false });

fastify.get('/readyz', async (request, reply) => {
  reply.statusCode = state.ready ? 200 : 503;
  reply.send({ status: state.ready ? 'ok' : 'error' });
});

fastify.get('/healthz', async (request, reply) => {
  reply.statusCode = state.healthy ? 200 : 503;
  reply.send({ status: state.healthy ? 'ok' : 'error' });
});

export const startServer = async (host, port) => {
  await fastify.listen({
    port,
    host,
  });

  console.info(`Healthz Server listening on ${fastify.server.address().port}`);
};
