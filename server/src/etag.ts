/**
 * The public API exposes a canonical, unquoted ETag value in JSON. HTTP
 * headers must use the quoted form, while Cosmos DB's `_etag` values are
 * already quoted. These helpers keep those representations unambiguous.
 */
export function normalizeEtag(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const normalized = value
    .trim()
    .replace(/^W\//, '')
    .replace(/^"(.*)"$/, '$1');

  return normalized || undefined;
}

export function formatEtagHeader(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;

  const normalized = value
    .trim()
    .replace(/^W\//, '')
    .replace(/^"(.*)"$/, '$1');

  return normalized ? `"${normalized}"` : undefined;
}
