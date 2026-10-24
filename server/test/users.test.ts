import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { InMemoryUserRepository } from '../src/repositories/inMemoryUserRepository.js';

const validUser = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+44 20 7946 0000',
  department: 'Engineering',
  location: 'London, UK',
  role: 'admin',
  status: 'active',
  notes: 'First programmer.',
};

describe('users API', () => {
  let app: ReturnType<typeof createApp>;
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    app = createApp({
      repository,
      clientOrigin: 'http://localhost:3000',
      clientDistPath: null,
      logRequests: false,
    });
  });

  async function create(overrides: Record<string, unknown> = {}) {
    return request(app)
      .post('/api/users')
      .send({ ...validUser, ...overrides });
  }

  it('creates a user and reads it back by id', async () => {
    const created = await create();

    expect(created.status).toBe(201);
    expect(created.headers.location).toMatch(/^\/api\/users\/[0-9a-f-]{36}$/);
    expect(created.headers.etag).toBe(`"${created.body.etag}"`);
    expect(created.body).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'admin',
      status: 'active',
    });
    expect(created.body).not.toHaveProperty('partitionKey');
    expect(created.body).not.toHaveProperty('_etag');

    const fetched = await request(app).get(`/api/users/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);
    expect(fetched.body.etag).toBe(created.body.etag);
  });

  it('normalizes email addresses to lowercase', async () => {
    const created = await create({ email: '  Ada@Example.COM ' });
    expect(created.status).toBe(201);
    expect(created.body.email).toBe('ada@example.com');
  });

  it('rejects invalid payloads with field-level details', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ firstName: '', lastName: 'Lovelace', email: 'not-an-email', role: 'owner' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'firstName' }),
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'role' }),
      ]),
    );
  });

  it('rejects duplicate email addresses', async () => {
    await create();
    const duplicate = await create({ firstName: 'Grace', email: 'ADA@example.com' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
  });

  it('lists, searches, filters, sorts and paginates users', async () => {
    await create({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', role: 'admin' });
    await create({ firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', role: 'member' });
    await create({ firstName: 'Katherine', lastName: 'Johnson', email: 'katherine@example.com', role: 'manager', status: 'invited' });

    const all = await request(app).get('/api/users');
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items).toHaveLength(3);
    expect(all.body.page).toBe(1);
    expect(all.body.totalPages).toBe(1);
    expect(all.body.items).toHaveLength(3);

    const newest = await request(app).get('/api/users?sort=lastName&order=desc');
    expect(newest.body.items.map((user: { lastName: string }) => user.lastName)).toEqual([
      'Lovelace',
      'Johnson',
      'Hopper',
    ]);

    const searched = await request(app).get('/api/users?search=hop');
    expect(searched.body.total).toBe(1);
    expect(searched.body.items[0].lastName).toBe('Hopper');

    const fullName = await request(app).get('/api/users?search=grace%20hopper');
    expect(fullName.body.total).toBe(1);

    const filtered = await request(app).get('/api/users?role=admin&status=active');
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.items[0].firstName).toBe('Ada');

    const sorted = await request(app).get('/api/users?sort=lastName&order=asc&pageSize=2');
    expect(sorted.body.items.map((user: { lastName: string }) => user.lastName)).toEqual([
      'Hopper',
      'Johnson',
    ]);
    expect(sorted.body.totalPages).toBe(2);

    const page2 = await request(app).get('/api/users?sort=lastName&order=asc&pageSize=2&page=2');
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.items[0].lastName).toBe('Lovelace');
  });

  it('updates a user and enforces optimistic concurrency', async () => {
    const created = await create();
    const id = created.body.id as string;
    const etag = created.body.etag as string;

    const updated = await request(app)
      .patch(`/api/users/${id}`)
      .set('If-Match', `"${etag}"`)
      .send({ firstName: 'Augusta', role: 'manager', email: 'ada.lovelace@example.com' });

    expect(updated.status).toBe(200);
    expect(updated.body.firstName).toBe('Augusta');
    expect(updated.body.role).toBe('manager');
    expect(updated.body.email).toBe('ada.lovelace@example.com');
    expect(updated.body.updatedAt).toBeDefined();
    expect(updated.body.etag).not.toBe(etag);

    const stale = await request(app)
      .patch(`/api/users/${id}`)
      .set('If-Match', `"${etag}"`)
      .send({ firstName: 'Stale' });

    expect(stale.status).toBe(412);
    expect(stale.body.error.code).toBe('PRECONDITION_FAILED');
  });

  it('rejects an empty update payload', async () => {
    const created = await create();
    const response = await request(app).patch(`/api/users/${created.body.id}`).send({});
    expect(response.status).toBe(422);
  });

  it('rejects updating a user to an email owned by someone else', async () => {
    await create({ email: 'grace@example.com' });
    const second = await create({ email: 'ada@example.com' });

    const response = await request(app)
      .patch(`/api/users/${second.body.id}`)
      .send({ email: 'grace@example.com' });

    expect(response.status).toBe(409);
  });

  it('deletes a user and returns 404 afterwards', async () => {
    const created = await create();
    const id = created.body.id as string;

    const deleted = await request(app).delete(`/api/users/${id}`);
    expect(deleted.status).toBe(204);

    const fetched = await request(app).get(`/api/users/${id}`);
    expect(fetched.status).toBe(404);
    expect(fetched.body.error.code).toBe('NOT_FOUND');

    const deletedAgain = await request(app).delete(`/api/users/${id}`);
    expect(deletedAgain.status).toBe(404);
  });

  it('returns directory statistics', async () => {
    await create({ email: 'one@example.com', role: 'admin', status: 'active' });
    await create({ email: 'two@example.com', role: 'member', status: 'active' });
    await create({ email: 'three@example.com', role: 'viewer', status: 'invited' });

    const response = await request(app).get('/api/users/stats');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      total: 3,
      active: 2,
      admins: 1,
      newThisMonth: 3,
    });
  });

  it('validates ids and pagination input', async () => {
    const badId = await request(app).get('/api/users/not-a-uuid');
    expect(badId.status).toBe(422);

    const badPage = await request(app).get('/api/users?page=0');
    expect(badPage.status).toBe(422);

    const tooLarge = await request(app).get('/api/users?pageSize=500');
    expect(tooLarge.status).toBe(422);

    const unknownRoute = await request(app).get('/api/nope');
    expect(unknownRoute.status).toBe(404);
  });

  it('handles malformed JSON bodies', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{"firstName": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('reports health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.cosmos.status).toBe('up');
  });
});
