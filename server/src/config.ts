import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// The repo-root .env is the source of truth (shared by the API and scripts).
// Real environment variables always win over values from the file.
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export const DATA_STORES = ['cosmos', 'memory'] as const;
export type DataStore = (typeof DATA_STORES)[number];

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
    CLIENT_ORIGIN: z.string().min(1).default('http://localhost:3000'),

    // "cosmos" persists to Azure Cosmos DB. "memory" runs a seeded, ephemeral
    // in-process store (handy for demos, UI work and offline development).
    DATA_STORE: z.enum(DATA_STORES).default('cosmos'),

    // Cosmos credentials are only required when DATA_STORE=cosmos. Empty
    // strings are treated as unset so a .env copied from .env.example can still
    // run the memory store without real credentials.
    COSMOS_ENDPOINT: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .refine(
          (value) => {
            try {
              const url = new URL(value);
              return url.protocol === 'https:' || url.protocol === 'http:';
            } catch {
              return false;
            }
          },
          { message: 'COSMOS_ENDPOINT must be a valid http(s) URL' },
        )
        .optional(),
    ),
    COSMOS_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    COSMOS_DATABASE: z.string().min(1).default('app'),
    COSMOS_CONTAINER: z.string().min(1).default('items'),
    // Value of the container's `/partitionKey` property used for user documents.
    // The default container is shared, so users live in their own logical partition.
    COSMOS_PARTITION_VALUE: z.string().min(1).default('users'),
  })
  .superRefine((values, context) => {
    if (values.DATA_STORE !== 'cosmos') return;

    if (!values.COSMOS_ENDPOINT) {
      context.addIssue({
        code: 'custom',
        path: ['COSMOS_ENDPOINT'],
        message: 'COSMOS_ENDPOINT is required when DATA_STORE=cosmos',
      });
    }
    if (!values.COSMOS_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['COSMOS_KEY'],
        message: 'COSMOS_KEY is required when DATA_STORE=cosmos',
      });
    }
  });

export type AppConfig = z.infer<typeof envSchema> & {
  isProduction: boolean;
  /** True when the configured endpoint is a local Cosmos DB emulator. */
  isEmulator: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${details}\n\n` +
        'Copy .env.example to .env and fill in your Cosmos DB settings.',
    );
  }

  const endpoint = result.data.COSMOS_ENDPOINT;
  const isEmulator = endpoint
    ? ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(endpoint).hostname)
    : false;

  return {
    ...result.data,
    isProduction: result.data.NODE_ENV === 'production',
    isEmulator,
  };
}
