import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const baseEnv = {
  NODE_ENV: 'test',
  CLIENT_ORIGIN: 'http://localhost:3000',
};

describe('loadConfig', () => {
  it('allows the memory store without Cosmos credentials', () => {
    const config = loadConfig({ ...baseEnv, DATA_STORE: 'memory' });

    expect(config.DATA_STORE).toBe('memory');
    expect(config.COSMOS_ENDPOINT).toBeUndefined();
    expect(config.COSMOS_KEY).toBeUndefined();
    expect(config.COSMOS_DATABASE).toBe('app');
    expect(config.COSMOS_CONTAINER).toBe('items');
    expect(config.COSMOS_PARTITION_VALUE).toBe('users');
    expect(config.isEmulator).toBe(false);
    expect(config.isProduction).toBe(false);
  });

  it('treats empty credential strings as unset in memory mode', () => {
    const config = loadConfig({
      ...baseEnv,
      DATA_STORE: 'memory',
      COSMOS_ENDPOINT: '',
      COSMOS_KEY: '',
    });

    expect(config.COSMOS_ENDPOINT).toBeUndefined();
    expect(config.COSMOS_KEY).toBeUndefined();
  });

  it('requires endpoint and key in Cosmos mode', () => {
    expect(() => loadConfig({ ...baseEnv, DATA_STORE: 'cosmos' })).toThrow(/COSMOS_ENDPOINT/);
    expect(() =>
      loadConfig({
        ...baseEnv,
        DATA_STORE: 'cosmos',
        COSMOS_ENDPOINT: 'https://example.documents.azure.com:443/',
      }),
    ).toThrow(/COSMOS_KEY/);
  });

  it('rejects a malformed Cosmos endpoint', () => {
    expect(() =>
      loadConfig({ ...baseEnv, DATA_STORE: 'memory', COSMOS_ENDPOINT: 'not-a-url' }),
    ).toThrow(/valid http\(s\) URL/);
  });

  it('detects the local emulator endpoint', () => {
    const config = loadConfig({
      ...baseEnv,
      DATA_STORE: 'cosmos',
      COSMOS_ENDPOINT: 'http://localhost:8081',
      COSMOS_KEY: 'emulator-key',
    });

    expect(config.isEmulator).toBe(true);
  });

  it('does not flag a remote Azure endpoint as an emulator', () => {
    const config = loadConfig({
      ...baseEnv,
      DATA_STORE: 'cosmos',
      COSMOS_ENDPOINT: 'https://example.documents.azure.com:443/',
      COSMOS_KEY: 'azure-key',
    });

    expect(config.isEmulator).toBe(false);
  });
});
