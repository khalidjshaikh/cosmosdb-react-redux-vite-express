export const USER_ROLES = ['admin', 'manager', 'member', 'viewer'] as const;
export const USER_STATUSES = ['active', 'invited', 'suspended'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  viewer: 'Viewer',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
};

export type SortField = 'createdAt' | 'updatedAt' | 'lastName';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  role: UserRole;
  status: UserStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  etag: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  role: UserRole;
  status: UserStatus;
  notes: string;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface UsersPage {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  newThisMonth: number;
}

export interface UserFilters {
  page: number;
  pageSize: number;
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
  sort: SortField;
  order: SortOrder;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  store?: 'cosmos' | 'memory';
  timestamp: string;
  uptimeSeconds: number;
  cosmos: {
    status: 'up' | 'down';
    latencyMs: number;
    message?: string;
  };
}
