import type { CSSProperties } from 'react';
import { avatarHue, displayName, formatDate, initials } from '../features/users/format';
import { ROLE_LABELS, STATUS_LABELS, type User } from '../features/users/types';
import { Icon } from './Icon';

interface UserTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  hasActiveFilters: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAdd: () => void;
  onClearFilters: () => void;
}

const SKELETON_ROWS = 6;

function TableHeader() {
  return (
    <thead>
      <tr>
        <th scope="col">Person</th>
        <th scope="col" className="col-optional">
          Department
        </th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
        <th scope="col" className="col-optional">
          Joined
        </th>
        <th scope="col" className="cell-actions">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}

function SkeletonTable() {
  return (
    <div className="table-wrap" aria-busy="true" aria-label="Loading people">
      <table className="user-table">
        <TableHeader />
        <tbody>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <tr key={index} className="skeleton-row">
              <td>
                <div className="user-cell">
                  <span className="skeleton skeleton-avatar" aria-hidden="true" />
                  <span className="skeleton-lines">
                    <span className="skeleton skeleton-line skeleton-line-name" aria-hidden="true" />
                    <span className="skeleton skeleton-line skeleton-line-email" aria-hidden="true" />
                  </span>
                </div>
              </td>
              <td className="col-optional">
                <span className="skeleton skeleton-line" aria-hidden="true" />
              </td>
              <td>
                <span className="skeleton skeleton-pill" aria-hidden="true" />
              </td>
              <td>
                <span className="skeleton skeleton-pill" aria-hidden="true" />
              </td>
              <td className="col-optional">
                <span className="skeleton skeleton-line skeleton-line-short" aria-hidden="true" />
              </td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UserTable({
  users,
  isLoading,
  hasActiveFilters,
  onEdit,
  onDelete,
  onAdd,
  onClearFilters,
}: UserTableProps) {
  if (isLoading) return <SkeletonTable />;

  if (!users || users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-art" aria-hidden="true">
          <span className="empty-orbit" />
          <span className="empty-orbit empty-orbit-sm" />
          <Icon name={hasActiveFilters ? 'search' : 'inbox'} size={26} />
        </div>
        <h3>{hasActiveFilters ? 'No people match those filters' : 'No people yet'}</h3>
        <p>
          {hasActiveFilters
            ? 'Try a different search term, or clear the filters to see everyone.'
            : 'Add your first teammate and their profile will appear here instantly.'}
        </p>
        {hasActiveFilters ? (
          <button type="button" className="btn btn-ghost" onClick={onClearFilters}>
            <Icon name="refresh" size={16} />
            Clear filters
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={16} />
            Add your first person
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="user-table">
        <TableHeader />
        <tbody>
          {users.map((user) => {
            const avatarStyle = { '--avatar-hue': avatarHue(user.id) } as CSSProperties;

            return (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <span className="avatar" style={avatarStyle} aria-hidden="true">
                      {initials(user)}
                    </span>
                    <div className="user-identity">
                      <span className="user-name">{displayName(user)}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="col-optional">
                  <div className="dept-cell">
                    <span>{user.department || '—'}</span>
                    {user.location ? <span className="cell-sub">{user.location}</span> : null}
                  </div>
                </td>
                <td>
                  <span className={`pill role-pill role-${user.role}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td>
                  <span className={`pill status-pill status-${user.status}`}>
                    <span className="status-dot" aria-hidden="true" />
                    {STATUS_LABELS[user.status]}
                  </span>
                </td>
                <td className="col-optional cell-muted">{formatDate(user.createdAt)}</td>
                <td className="cell-actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => onEdit(user)}
                      aria-label={`Edit ${displayName(user)}`}
                      title="Edit"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button-danger"
                      onClick={() => onDelete(user)}
                      aria-label={`Delete ${displayName(user)}`}
                      title="Delete"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
