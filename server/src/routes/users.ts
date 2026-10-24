import { Router, type Response } from 'express';
import { formatEtagHeader, normalizeEtag } from '../etag.js';
import { notFound, preconditionFailed } from '../errors.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  toUserDto,
  updateUserSchema,
  userIdSchema,
} from '../models/user.js';
import { parseOrThrow } from '../middleware/validate.js';
import type { UserRepository } from '../repositories/userRepository.js';

function setEtag(response: Response, etag: string): void {
  const header = formatEtagHeader(etag);
  if (header) response.setHeader('ETag', header);
}

export function createUsersRouter(repository: UserRepository): Router {
  const router = Router();

  router.get('/', async (request, response) => {
    const query = parseOrThrow(listUsersQuerySchema, request.query);
    const { items, total } = await repository.list(query);
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

    response.setHeader('Cache-Control', 'no-store');
    response.json({
      items: items.map(toUserDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
    });
  });

  // Registered before "/:id" so "stats" is not treated as an id.
  router.get('/stats', async (_request, response) => {
    const stats = await repository.stats();
    response.setHeader('Cache-Control', 'no-store');
    response.json(stats);
  });

  router.get('/:id', async (request, response) => {
    const id = parseOrThrow(userIdSchema, request.params.id);
    const user = await repository.findById(id);
    if (!user) throw notFound('User not found');

    setEtag(response, user._etag ?? '');
    response.setHeader('Cache-Control', 'no-store');
    response.json(toUserDto(user));
  });

  router.post('/', async (request, response) => {
    const input = parseOrThrow(createUserSchema, request.body);
    const user = await repository.create(input);
    const dto = toUserDto(user);

    setEtag(response, user._etag ?? '');
    response.setHeader('Location', `/api/users/${dto.id}`);
    response.status(201).json(dto);
  });

  router.patch('/:id', async (request, response) => {
    const id = parseOrThrow(userIdSchema, request.params.id);
    const patch = parseOrThrow(updateUserSchema, request.body);
    const ifMatch = normalizeEtag(request.header('if-match'));

    if (!ifMatch && request.header('if-match')) {
      throw preconditionFailed('If-Match header is empty.');
    }

    const user = await repository.update(id, patch, ifMatch);
    if (!user) throw notFound('User not found');

    setEtag(response, user._etag ?? '');
    response.json(toUserDto(user));
  });

  router.delete('/:id', async (request, response) => {
    const id = parseOrThrow(userIdSchema, request.params.id);
    const removed = await repository.remove(id);
    if (!removed) throw notFound('User not found');
    response.status(204).end();
  });

  return router;
}
