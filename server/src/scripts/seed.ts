import { loadConfig } from '../config.js';
import { SEED_USERS } from '../data/seedUsers.js';
import { CosmosUserRepository } from '../repositories/cosmosUserRepository.js';



async function main(): Promise<void> {
  const config = loadConfig();

  if (config.DATA_STORE === 'memory') {
    console.log(
      '[seed] DATA_STORE=memory — the in-memory store is seeded automatically at API startup; nothing to do.',
    );
    return;
  }

  const repository = CosmosUserRepository.fromConfig(config);
  const shouldReset = process.argv.includes('--reset');

  try {
    await repository.ping();
    console.log(`[seed] connected to ${config.COSMOS_DATABASE}/${config.COSMOS_CONTAINER}`);

    if (shouldReset) {
      const existing = await repository.list({
        page: 1,
        pageSize: 100,
        sort: 'createdAt',
        order: 'asc',
      });

      for (const user of existing.items) {
        await repository.remove(user.id);
      }
      console.log(`[seed] removed ${existing.items.length} existing user(s)`);
    } else {
      const existing = await repository.list({
        page: 1,
        pageSize: 1,
        sort: 'createdAt',
        order: 'desc',
      });

      if (existing.total > 0) {
        console.log(
          `[seed] container already holds ${existing.total} user(s); nothing to do. Use --reset to replace them.`,
        );
        return;
      }
    }

    let created = 0;
    for (const user of SEED_USERS) {
      await repository.create(user);
      created += 1;
    }
    console.log(`[seed] created ${created} users`);
  } finally {
    repository.close();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] failed:', error);
  process.exitCode = 1;
});
