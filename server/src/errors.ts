export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'INTERNAL_ERROR';

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, message: string, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, 'BAD_REQUEST', details);

export const validationError = (details: unknown) =>
  new HttpError(422, 'Please correct the highlighted fields.', 'VALIDATION_ERROR', details);

export const notFound = (message = 'Resource not found') =>
  new HttpError(404, message, 'NOT_FOUND');

export const conflict = (message: string, details?: unknown) =>
  new HttpError(409, message, 'CONFLICT', details);

export const preconditionFailed = (message: string) =>
  new HttpError(412, message, 'PRECONDITION_FAILED');
