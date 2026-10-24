import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  resetFilters,
  setRole,
  setSearch,
  setSort,
  setStatus,
} from '../features/users/usersSlice';
import { selectHasActiveFilters, selectUserFilters } from '../store/selectors';
import { ROLE_LABELS, STATUS_LABELS, USER_ROLES, USER_STATUSES } from '../features/users/types';
import type { SortField, SortOrder } from '../features/users/types';
import { Icon } from './Icon';

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'lastName:asc', label: 'Name A–Z' },
  { value: 'lastName:desc', label: 'Name Z–A' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
];

interface UserToolbarProps {
  isFetching: boolean;
}

export function UserToolbar({ isFetching }: UserToolbarProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectUserFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  return (
    <div className="toolbar">
      <div className="search-field">
        <Icon name="search" size={17} className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Search by name, email, or department…"
          aria-label="Search people"
          value={filters.search}
          onChange={(event) => dispatch(setSearch(event.target.value))}
        />
        {filters.search ? (
          <button
            type="button"
            className="search-clear"
            onClick={() => dispatch(setSearch(''))}
            aria-label="Clear search"
          >
            <Icon name="x" size={14} />
          </button>
        ) : isFetching ? (
          <span className="search-busy" aria-label="Updating results">
            <Icon name="spinner" size={15} className="spin" />
          </span>
        ) : null}
      </div>

      <div className="select-control">
        <select
          className={`select ${filters.role !== 'all' ? 'is-active' : ''}`}
          aria-label="Filter by role"
          value={filters.role}
          onChange={(event) =>
            dispatch(setRole(event.target.value as (typeof USER_ROLES)[number] | 'all'))
          }
        >
          <option value="all">All roles</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={15} className="select-chevron" />
      </div>

      <div className="select-control">
        <select
          className={`select ${filters.status !== 'all' ? 'is-active' : ''}`}
          aria-label="Filter by status"
          value={filters.status}
          onChange={(event) =>
            dispatch(setStatus(event.target.value as (typeof USER_STATUSES)[number] | 'all'))
          }
        >
          <option value="all">All statuses</option>
          {USER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={15} className="select-chevron" />
      </div>

      <div className="select-control">
        <select
          className="select"
          aria-label="Sort people"
          value={`${filters.sort}:${filters.order}`}
          onChange={(event) => {
            const [sort, order] = event.target.value.split(':') as [SortField, SortOrder];
            dispatch(setSort({ sort, order }));
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={15} className="select-chevron" />
      </div>

      {hasActiveFilters ? (
        <button
          type="button"
          className="btn btn-quiet toolbar-reset"
          onClick={() => dispatch(resetFilters())}
        >
          <Icon name="x" size={15} />
          Clear filters
        </button>
      ) : null}

    </div>
  );
}
