import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserDocument,
  UserStats,
} from '../models/user.js';

export interface ListUsersResult {
  items: UserDocument[];
  total: number;
}

export interface UserRepository {
  /** Lightweight connectivity/auth check used by the health endpoint. */
  ping(): Promise<void>;
  list(query: ListUsersQuery): Promise<ListUsersResult>;
  findById(id: string): Promise<UserDocument | null>;
  findByEmail(email: string): Promise<UserDocument | null>;
  create(input: CreateUserInput): Promise<UserDocument>;
  update(id: string, patch: UpdateUserInput, ifMatch?: string): Promise<UserDocument | null>;
  remove(id: string): Promise<boolean>;
  stats(): Promise<UserStats>;
}

export interface DisposableUserRepository extends UserRepository {
  close(): void;
}
