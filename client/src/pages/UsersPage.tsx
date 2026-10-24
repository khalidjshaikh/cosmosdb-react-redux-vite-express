import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { notify } from '../features/notifications/notificationsSlice';
import { displayName } from '../features/users/format';
import {
  getApiErrorMessage,
  useDeleteUserMutation,
  useGetHealthQuery,
  useListUsersQuery,
} from '../features/users/usersApi';
import { resetFilters, setPage } from '../features/users/usersSlice';
import { selectHasActiveFilters, selectUserFilters } from '../store/selectors';
import type { User } from '../features/users/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { Pagination } from '../components/Pagination';
import { StatsCards } from '../components/StatsCards';
import { UserFormDialog } from '../components/UserFormDialog';
import { UserTable } from '../components/UserTable';
import { UserToolbar } from '../components/UserToolbar';

export function UsersPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectUserFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const queryArgs = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useListUsersQuery(queryArgs);
  const { data: health } = useGetHealthQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  // If the current page disappears (last row deleted, filters narrowed) move back.
  useEffect(() => {
    if (data && filters.page > data.totalPages) {
      dispatch(setPage(data.totalPages));
    }
  }, [data, dispatch, filters.page]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormOpen(true);
  }

  function handleSaved(user: User, mode: 'created' | 'updated') {
    setFormOpen(false);
    dispatch(
      notify({
        tone: 'success',
        title: mode === 'created' ? 'Person added' : 'Changes saved',
        description:
          mode === 'created'
            ? `${displayName(user)} is now in the directory.`
            : `${displayName(user)}'s profile has been updated.`,
      }),
    );
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await deleteUser(deleting.id).unwrap();
      dispatch(
        notify({
          tone: 'success',
          title: 'Person removed',
          description: `${displayName(deleting)} was deleted from the directory.`,
        }),
      );
      setDeleting(null);
    } catch (deleteError) {
      dispatch(
        notify({
          tone: 'error',
          title: 'Could not remove person',
          description: getApiErrorMessage(deleteError),
        }),
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <Icon name="database" size={14} />
            {health?.store === 'memory' ? 'In-memory store · ephemeral' : 'Live from Azure Cosmos DB'}
          </p>
          <h1>People directory</h1>
          <p className="page-subtitle">
            Create, search, and manage the people in your workspace.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={openCreate}>
          <Icon name="plus" size={17} />
          Add person
        </button>
      </div>

      <StatsCards />

      <section className="panel" aria-label="People">
        <UserToolbar isFetching={isFetching} />

        {isError ? (
          <div className="error-banner" role="alert">
            <Icon name="alert" size={18} />
            <div>
              <strong>Could not load people</strong>
              <span>{getApiErrorMessage(error)}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refetch()}>
              <Icon name="refresh" size={15} />
              Retry
            </button>
          </div>
        ) : null}

        {isError && !data ? (
          <div className="empty-state">
            <div className="empty-art" aria-hidden="true">
              <span className="empty-orbit" />
              <Icon name="alert" size={26} />
            </div>
            <h3>The directory is unavailable</h3>
            <p>Check that the API server is running and can reach Cosmos DB.</p>
            <button type="button" className="btn btn-ghost" onClick={() => refetch()}>
              <Icon name="refresh" size={16} />
              Try again
            </button>
          </div>
        ) : (
          <>
            <UserTable
              users={data?.items}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onEdit={openEdit}
              onDelete={setDeleting}
              onAdd={openCreate}
              onClearFilters={() => dispatch(resetFilters())}
            />

            {data && data.total > 0 ? (
              <Pagination
                total={data.total}
                totalPages={data.totalPages}
                isFetching={isFetching}
              />
            ) : null}
          </>
        )}
      </section>

      {formOpen ? (
        <UserFormDialog
          key={editing?.id ?? 'new'}
          user={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          user={deleting}
          isDeleting={isDeleting}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}
