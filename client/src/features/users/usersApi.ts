import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateUserPayload,
  HealthStatus,
  SortField,
  SortOrder,
  UpdateUserPayload,
  User,
  UserRole,
  UserStats,
  UserStatus,
  UsersPage,
} from './types';

export interface ListUsersArgs {
  page: number;
  pageSize: number;
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
  sort: SortField;
  order: SortOrder;
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string | null; message: string }>;
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error === 'object' &&
    (value as ApiErrorBody).error !== null &&
    typeof (value as ApiErrorBody).error.message === 'string'
  );
}

function errorData(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    return (error as { data: unknown }).data;
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const data = errorData(error);
  if (isApiErrorBody(data)) return data.error.message;
  if (typeof data === 'string' && data.trim()) return data;

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const message = (error as { error: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return 'Could not reach the API. Is the server running?';
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  const data = errorData(error);
  if (!isApiErrorBody(data) || !Array.isArray(data.error.details)) return {};

  return data.error.details.reduce<Record<string, string>>((fields, detail) => {
    if (detail.field && !fields[detail.field]) fields[detail.field] = detail.message;
    return fields;
  }, {});
}

function listParams(args: ListUsersArgs): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: args.page,
    pageSize: args.pageSize,
    sort: args.sort,
    order: args.order,
  };

  if (args.search.trim()) params.search = args.search.trim();
  if (args.role !== 'all') params.role = args.role;
  if (args.status !== 'all') params.status = args.status;

  return params;
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'UserStats', 'Health'],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    listUsers: builder.query<UsersPage, ListUsersArgs>({
      query: (args) => ({ url: '/users', params: listParams(args) }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((user) => ({ type: 'User' as const, id: user.id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    getUserStats: builder.query<UserStats, void>({
      query: () => '/users/stats',
      providesTags: [{ type: 'UserStats', id: 'STATS' }],
    }),
    getHealth: builder.query<HealthStatus, void>({
      query: () => '/health',
      providesTags: [{ type: 'Health', id: 'HEALTH' }],
    }),
    createUser: builder.mutation<User, CreateUserPayload>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),
    updateUser: builder.mutation<User, { id: string; changes: UpdateUserPayload; etag?: string }>({
      query: ({ id, changes, etag }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: changes,
        headers: etag ? { 'If-Match': `"${etag}"` } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'UserStats', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useGetUserStatsQuery,
  useGetHealthQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
