import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../errors.js';

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No route matches ${request.method} ${request.originalUrl}`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  // Malformed JSON from express.json()
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Request body contains invalid JSON.' },
    });
    return;
  }

  console.error('[api] unhandled error:', error);
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong while processing the request.',
    },
  });
};
