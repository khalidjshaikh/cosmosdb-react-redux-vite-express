import { describe, expect, it } from 'vitest';
import { formatEtagHeader, normalizeEtag } from '../src/etag.js';

describe('ETag helpers', () => {
  it('normalizes quoted, weak and raw ETags to the canonical unquoted value', () => {
    expect(normalizeEtag('"abc"')).toBe('abc');
    expect(normalizeEtag('W/"abc"')).toBe('abc');
    expect(normalizeEtag('abc')).toBe('abc');
    expect(normalizeEtag('  "abc"  ')).toBe('abc');
  });

  it('ignores empty values', () => {
    expect(normalizeEtag(undefined)).toBeUndefined();
    expect(normalizeEtag('')).toBeUndefined();
    expect(formatEtagHeader(undefined)).toBeUndefined();
    expect(formatEtagHeader('  ')).toBeUndefined();
  });

  it('formats raw and already-quoted ETags with exactly one pair of quotes', () => {
    expect(formatEtagHeader('abc')).toBe('"abc"');
    expect(formatEtagHeader('"abc"')).toBe('"abc"');
    expect(formatEtagHeader('W/"abc"')).toBe('"abc"');
  });

  it('round-trips a Cosmos-style quoted ETag through the header', () => {
    const cosmosEtag = '"d256877f-e7a3-413e-8207-f825cbcf7f4b"';

    expect(normalizeEtag(cosmosEtag)).toBe('d256877f-e7a3-413e-8207-f825cbcf7f4b');
    expect(formatEtagHeader(cosmosEtag)).toBe(cosmosEtag);
  });
});
