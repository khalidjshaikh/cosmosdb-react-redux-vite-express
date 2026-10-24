import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig, type AppConfig } from './config.js';
import { SEED_USERS } from './data/seedUsers.js';
import { CosmosUserRepository } from './repositories/cosmosUserRepository.js';
import { InMemoryUserRepository } from './repositories/inMemoryUserRepository.js';

const config = loadConfig();
const clientDistPath = fileURLToPath(new URL('../../client/dist', import.meta.url));

async function createRepository(appConfig: AppConfig) {
  if (appConfig.DATA_STORE === 'memory') {
    const memory = new InMemoryUserRepository(appConfig.COSMOS_PARTITION_VALUE);
    for (const user of SEED_USERS) {
      await memory.create(user);
    }
    return memory;
  }

  return CosmosUserRepository.fromConfig(appConfig);
}

const repository = await createRepository(config);

const app = createApp({
  repository,
  store: config.DATA_STORE,
  clientOrigin: config.CLIENT_ORIGIN,
  clientDistPath,
  logRequests: !config.isProduction,
});

const server = app.listen(config.PORT, () => {
  console.log(`[api] listening on http://localhost:${config.PORT}`);

  if (config.DATA_STORE === 'memory') {
    console.log(
      `[api] data store: in-memory (ephemeral, ${SEED_USERS.length} demo users)`,
    );
  } else {
    console.log(
      `[api] Cosmos DB: database="${config.COSMOS_DATABASE}" container="${config.COSMOS_CONTAINER}"`,
    );
  }
});

let shuttingDown = false;

function closeRepository(): void {
  if ('close' in repository) repository.close();
}

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[api] ${signal} received, shutting down...`);

  server.close(() => {
    closeRepository();
    process.exit(0);
  });

  // Do not let open keep-alive sockets hang the process forever.
  setTimeout(() => {
    closeRepository();
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
