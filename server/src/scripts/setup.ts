import { CosmosClient } from '@azure/cosmos';
import { loadConfig } from '../config.js';

/**
 * Creates the configured database and the generic "items" container used by
 * the app. Safe to run repeatedly: existing resources are left untouched.
 *
 * The container is partitioned by `/partitionKey`; user documents live in the
 * `COSMOS_PARTITION_VALUE` logical partition (default `users`).
 */
async function main(): Promise<void> {
  const config = loadConfig();

  if (config.DATA_STORE === 'memory') {
    console.log(
      '[setup] DATA_STORE=memory — the in-memory store needs no database setup; nothing to do.',
    );
    return;
  }

  const { COSMOS_ENDPOINT: endpoint, COSMOS_KEY: key } = config;
  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY are required when DATA_STORE=cosmos.');
  }

  const client = new CosmosClient({
    endpoint,
    key,
    connectionPolicy: { enableEndpointDiscovery: !config.isEmulator },
    userAgentSuffix: 'cosmodb-redux-setup/1.0',
  });

  try {
    const { database } = await client.databases.createIfNotExists({
      id: config.COSMOS_DATABASE,
    });

    const { container } = await database.containers.createIfNotExists({
      id: config.COSMOS_CONTAINER,
      partitionKey: { paths: ['/partitionKey'] },
    });

    console.log(
      `[setup] ready: ${database.id}/${container.id} (partition key /partitionKey)`,
    );
    console.log(
      `[setup] users live in the "${config.COSMOS_PARTITION_VALUE}" logical partition`,
    );
    console.log('[setup] next: npm run seed && npm run dev');
  } finally {
    client.dispose();
  }
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[setup] failed: ${detail}`);
  console.error(
    '[setup] check COSMOS_ENDPOINT/COSMOS_KEY and that the emulator or Azure account is reachable.',
  );
  process.exitCode = 1;
});
