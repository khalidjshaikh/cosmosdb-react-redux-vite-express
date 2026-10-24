import { randomUUID } from 'node:crypto';
import { conflict, preconditionFailed } from '../errors.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserDocument,
  UserStats,
} from '../models/user.js';
import type { ListUsersResult, UserRepository } from './userRepository.js';

/**
 * In-memory implementation of UserRepository used by the test suite.
 * Mirrors the filtering, pagination, uniqueness and ETag semantics of Cosmos DB.
 */
export class InMemoryUserRepository implements UserRepository {
  readonly #users = new Map<string, UserDocument>();
  #version = 0;
  readonly #partitionValue: string;

  constructor(partitionValue = 'users') {
    this.#partitionValue = partitionValue;
  }

  async ping(): Promise<void> {
    // Always reachable.
  }

  async list(query: ListUsersQuery): Promise<ListUsersResult> {
    const search = query.search?.toLowerCase();
    const filtered = [...this.#users.values()].filter((user) => {
      if (query.role && user.role !== query.role) return false;
      if (query.status && user.status !== query.status) return false;
      if (!search) return true;

      return [user.firstName, user.lastName, `${user.firstName} ${user.lastName}`, user.email, user.department]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });

    const direction = query.order === 'asc' ? 1 : -1;
    const sortKey = query.sort;

    filtered.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (left === right) return a.id.localeCompare(b.id);
      return left < right ? -direction : direction;
    });

    const offset = (query.page - 1) * query.pageSize;
    return {
      items: filtered.slice(offset, offset + query.pageSize),
      total: filtered.length,
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.#users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalized = email.trim().toLowerCase();
    return (
      [...this.#users.values()].find((user) => user.email.toLowerCase() === normalized) ?? null
    );
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    if (await this.findByEmail(input.email)) {
      throw conflict('A user with that email already exists.');
    }

    const now = new Date().toISOString();
    const document: UserDocument = {
      id: randomUUID(),
      partitionKey: this.#partitionValue,
      type: 'user',
      ...input,
      createdAt: now,
      updatedAt: now,
      _etag: this.#nextEtag(),
    };

    this.#users.set(document.id, document);
    return document;
  }

  async update(
    id: string,
    patch: UpdateUserInput,
    ifMatch?: string,
  ): Promise<UserDocument | null> {
    const existing = this.#users.get(id);
    if (!existing) return null;

    if (ifMatch && ifMatch !== existing._etag) {
      throw preconditionFailed('This user changed since you loaded it. Refresh and try again.');
    }

    if (patch.email && patch.email !== existing.email) {
      const owner = await this.findByEmail(patch.email);
      if (owner && owner.id !== id) {
        throw conflict('A user with that email already exists.');
      }
    }

    const updated: UserDocument = {
      ...existing,
      ...patch,
      id: existing.id,
      partitionKey: existing.partitionKey,
      type: 'user',
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      _etag: this.#nextEtag(),
    };

    this.#users.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.#users.delete(id);
  }

  async stats(): Promise<UserStats> {
    const users = [...this.#users.values()];
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    return {
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      admins: users.filter((user) => user.role === 'admin').length,
      newThisMonth: users.filter((user) => user.createdAt >= startOfMonth.toISOString()).length,
    };
  }

  #nextEtag(): string {
    this.#version += 1;
    return `etag-${this.#version}`;
  }
}
