import { z } from 'zod';

export const USER_ROLES = ['admin', 'manager', 'member', 'viewer'] as const;
export const USER_STATUSES = ['active', 'invited', 'suspended'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

const firstName = z.string().trim().min(1, 'First name is required').max(80, 'Keep it under 80 characters');
const lastName = z.string().trim().min(1, 'Last name is required').max(80, 'Keep it under 80 characters');
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Enter a valid email address'));
const phone = z
  .string()
  .trim()
  .max(32, 'Phone number is too long')
  .regex(/^[0-9+().\-\s]*$/, 'Enter a valid phone number');
const department = z.string().trim().max(80, 'Keep it under 80 characters');
const location = z.string().trim().max(120, 'Keep it under 120 characters');
const notes = z.string().trim().max(1000, 'Notes must be under 1000 characters');

const userFields = {
  firstName,
  lastName,
  email,
  phone,
  department,
  location,
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  notes,
};

export const createUserSchema = z
  .object({
    ...userFields,
    phone: phone.default(''),
    department: department.default(''),
    location: location.default(''),
    role: userFields.role.default('member'),
    status: userFields.status.default('active'),
    notes: notes.default(''),
  })
  .strict();

export const updateUserSchema = z
  .object(userFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

const sortFields = ['createdAt', 'updatedAt', 'lastName'] as const;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100, 'Search is too long').optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  sort: z.enum(sortFields).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const userIdSchema = z.uuid('Invalid user id');

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/** Shape persisted in Cosmos DB. */
export interface UserDocument extends Required<Omit<CreateUserInput, 'email'>> {
  id: string;
  email: string;
  partitionKey: string;
  type: 'user';
  createdAt: string;
  updatedAt: string;
  _etag?: string;
}

/** Shape returned by the HTTP API (Cosmos system properties removed). */
export interface UserDto {
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

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  newThisMonth: number;
}

export function toUserDto(document: UserDocument): UserDto {
  return {
    id: document.id,
    firstName: document.firstName,
    lastName: document.lastName,
    email: document.email,
    phone: document.phone,
    department: document.department,
    location: document.location,
    role: document.role,
    status: document.status,
    notes: document.notes,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    etag: (document._etag ?? '').replace(/^"|"$/g, ''),
  };
}
