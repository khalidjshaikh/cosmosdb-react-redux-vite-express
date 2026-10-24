import type { z } from 'zod';
import { validationError } from '../errors.js';

/**
 * Parses arbitrary input with a Zod schema and throws a 422 HttpError with
 * field-level details when validation fails.
 */
export function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw validationError(
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || null,
        message: issue.message,
      })),
    );
  }

  return result.data;
}
