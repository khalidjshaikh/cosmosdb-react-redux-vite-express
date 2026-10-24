import { randomUUID } from 'node:crypto';
import { CosmosClient, type Container, type SqlParameter } from '@azure/cosmos';
import type { AppConfig } from '../config.js';
import { conflict, HttpError, notFound, preconditionFailed } from '../errors.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserDocument,
  UserStats,
} from '../models/user.js';
import type {
  DisposableUserRepository,
  ListUsersResult,
  UserRepository,
} from './userRepository.js';

const SYSTEM_PROPERTIES = ['_rid', '_self', '_etag', '_attachments', '_ts'] as const;

function withoutSystemProperties(document: UserDocument): UserDocument {
  const copy: Record<string, unknown> = { ...document };
  for (const property of SYSTEM_PROPERTIES) delete copy[property];
  return copy as unknown as UserDocument;
}

function isCosmosError(error: unknown): error is { code?: number; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export class CosmosUserRepository implements UserRepository, DisposableUserRepository {
  readonly #client: CosmosClient;
  readonly #container: Container;
  readonly #partitionValue: string;

  constructor(client: CosmosClient, container: Container, partitionValue: string) {
    this.#client = client;
    this.#container = container;
    this.#partitionValue = partitionValue;
  }

  static fromConfig(config: AppConfig): CosmosUserRepository {
    const client = new CosmosClient({
      endpoint: config.COSMOS_ENDPOINT,
      key: config.COSMOS_KEY,
      // The emulator serves a single gateway; endpoint discovery is for
      // multi-region Azure accounts only.
      connectionPolicy: { enableEndpointDiscovery: !config.isEmulator },
      userAgentSuffix: 'cosmodb-redux/1.0',
    });

    const container = client
      .database(config.COSMOS_DATABASE)
      .container(config.COSMOS_CONTAINER);

    return new CosmosUserRepository(client, container, config.COSMOS_PARTITION_VALUE);
  }

  async ping(): Promise<void> {
    // Metadata read: proves endpoint, key and network access without consuming RU/s.
    await this.#container.read();
  }

  async list(query: ListUsersQuery): Promise<ListUsersResult> {
    const { where, parameters } = this.#buildFilter(query);
    const sortColumn = {
      createdAt: 'c.createdAt',
      updatedAt: 'c.updatedAt',
      lastName: 'c.lastName',
    }[query.sort];
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.pageSize;

    const itemsQuery = {
      query: `SELECT * FROM c
              WHERE ${where}
              ORDER BY ${sortColumn} ${direction}
              OFFSET ${offset} LIMIT ${query.pageSize}`,
      parameters,
    };
    const countQuery = {
      query: `SELECT VALUE COUNT(1) FROM c WHERE ${where}`,
      parameters,
    };

    const [items, count] = await Promise.all([
      this.#container.items
        .query<UserDocument>(itemsQuery, { partitionKey: this.#partitionValue })
        .fetchAll(),
      this.#container.items
        .query<number>(countQuery, { partitionKey: this.#partitionValue })
        .fetchAll(),
    ]);

    return {
      items: items.resources,
      total: count.resources[0] ?? 0,
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    try {
      const { resource } = await this.#container
        .item(id, this.#partitionValue)
        .read<UserDocument>();

      return resource && resource.type === 'user' ? resource : null;
    } catch (error) {
      if (isCosmosError(error) && error.code === 404) return null;
      throw this.#translateError(error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const { resources } = await this.#container.items
      .query<UserDocument>(
        {
          query: `SELECT TOP 1 * FROM c
                  WHERE c.partitionKey = @partitionKey
                    AND c.type = 'user'
                    AND LOWER(c.email) = @email`,
          parameters: [
            { name: '@partitionKey', value: this.#partitionValue },
            { name: '@email', value: email.trim().toLowerCase() },
          ],
        },
        { partitionKey: this.#partitionValue },
      )
      .fetchAll();

    return resources[0] ?? null;
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw conflict('A user with that email already exists.');

    const now = new Date().toISOString();
    const document: UserDocument = {
      id: randomUUID(),
      partitionKey: this.#partitionValue,
      type: 'user',
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      department: input.department,
      location: input.location,
      role: input.role,
      status: input.status,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const { resource } = await this.#container.items.create<UserDocument>(document);
      if (!resource) {
        throw new HttpError(500, 'Cosmos DB did not return the created user', 'INTERNAL_ERROR');
      }
      return resource;
    } catch (error) {
      if (isCosmosError(error) && error.code === 409) {
        throw conflict('A user with that id already exists.');
      }
      throw this.#translateError(error);
    }
  }

  async update(
    id: string,
    patch: UpdateUserInput,
    ifMatch?: string,
  ): Promise<UserDocument | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    if (patch.email && patch.email !== existing.email) {
      const owner = await this.findByEmail(patch.email);
      if (owner && owner.id !== id) {
        throw conflict('A user with that email already exists.');
      }
    }

    const updated: UserDocument = {
      ...withoutSystemProperties(existing),
      ...patch,
      id: existing.id,
      partitionKey: existing.partitionKey,
      type: 'user',
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Cosmos DB expects the raw ETag (with quotes) in the If-Match condition.
    // The public API exposes the unquoted value, so restore the quoting here.
    const etag = ifMatch?.replace(/^"|"$/g, '');
    const accessCondition = etag
      ? { type: 'IfMatch' as const, condition: `"${etag}"` }
      : undefined;

    try {
      const { resource } = await this.#container
        .item(id, this.#partitionValue)
        .replace<UserDocument>(updated, { accessCondition });

      if (!resource) throw notFound('User not found');
      return resource;
    } catch (error) {
      if (isCosmosError(error)) {
        if (error.code === 404) return null;
        if (error.code === 412) {
          throw preconditionFailed('This user changed since you loaded it. Refresh and try again.');
        }
        if (error.code === 409) {
          throw conflict('A user with that email already exists.');
        }
      }
      throw this.#translateError(error);
    }
  }

  async remove(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    try {
      await this.#container.item(id, this.#partitionValue).delete();
      return true;
    } catch (error) {
      if (isCosmosError(error) && error.code === 404) return false;
      throw this.#translateError(error);
    }
  }

  async stats(): Promise<UserStats> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const count = async (predicate: string, extra: SqlParameter[] = []): Promise<number> => {
      const { resources } = await this.#container.items
        .query<number>(
          {
            query: `SELECT VALUE COUNT(1) FROM c
                    WHERE c.partitionKey = @partitionKey
                      AND c.type = 'user'
                      ${predicate ? `AND (${predicate})` : ''}`,
            parameters: [{ name: '@partitionKey', value: this.#partitionValue }, ...extra],
          },
          { partitionKey: this.#partitionValue },
        )
        .fetchAll();

      return resources[0] ?? 0;
    };

    const [total, active, admins, newThisMonth] = await Promise.all([
      count(''),
      count('c.status = @status', [{ name: '@status', value: 'active' }]),
      count('c.role = @role', [{ name: '@role', value: 'admin' }]),
      count('c.createdAt >= @startOfMonth', [
        { name: '@startOfMonth', value: startOfMonth.toISOString() },
      ]),
    ]);

    return { total, active, admins, newThisMonth };
  }

  close(): void {
    void this.#client.dispose();
  }

  #buildFilter(query: ListUsersQuery): { where: string; parameters: SqlParameter[] } {
    const clauses = ['c.partitionKey = @partitionKey', "c.type = 'user'"];
    const parameters: SqlParameter[] = [{ name: '@partitionKey', value: this.#partitionValue }];

    if (query.search) {
      clauses.push(`(
        CONTAINS(LOWER(c.firstName), @search)
        OR CONTAINS(LOWER(c.lastName), @search)
        OR CONTAINS(LOWER(CONCAT(c.firstName, ' ', c.lastName)), @search)
        OR CONTAINS(LOWER(c.email), @search)
        OR CONTAINS(LOWER(c.department), @search)
      )`);
      parameters.push({ name: '@search', value: query.search.toLowerCase() });
    }

    if (query.role) {
      clauses.push('c.role = @role');
      parameters.push({ name: '@role', value: query.role });
    }

    if (query.status) {
      clauses.push('c.status = @status');
      parameters.push({ name: '@status', value: query.status });
    }

    return { where: clauses.join(' AND '), parameters };
  }

  #translateError(error: unknown): Error {
    if (error instanceof HttpError) return error;
    if (isCosmosError(error)) {
      if (error.code === 404) return notFound('User not found');
      if (error.code === 429) {
        return new HttpError(
          503,
          'Cosmos DB is throttling requests. Please retry.',
          'INTERNAL_ERROR',
        );
      }
      if (error.code === 401 || error.code === 403) {
        return new HttpError(
          502,
          'Cosmos DB rejected the configured credentials.',
          'INTERNAL_ERROR',
        );
      }
    }
    return error instanceof Error ? error : new Error('Unexpected Cosmos DB error');
  }
}
