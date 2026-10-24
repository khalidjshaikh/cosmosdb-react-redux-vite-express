import { useEffect } from 'react';
import { displayName } from '../features/users/format';
import type { User } from '../features/users/types';
import { Icon } from './Icon';

interface ConfirmDialogProps {
  user: User;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ user, isDeleting, onCancel, onConfirm }: ConfirmDialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, isDeleting]);

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        className="dialog dialog-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <header className="dialog-header">
          <div className="dialog-heading-with-icon">
            <span className="danger-icon" aria-hidden="true">
              <Icon name="trash" size={18} />
            </span>
            <div>
              <h2 id="delete-dialog-title">Remove person</h2>
              <p id="delete-dialog-description">
                This permanently deletes the profile from Cosmos DB.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onCancel}
            aria-label="Close dialog"
            disabled={isDeleting}
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="dialog-body">
          <div className="delete-summary">
            <span className="delete-avatar" aria-hidden="true">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
            <div>
              <strong>{displayName(user)}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <p className="delete-note">
            You can add them again later, but their history and notes will be gone.
          </p>
        </div>

        <footer className="dialog-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isDeleting}>
            Keep person
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Icon name="spinner" size={16} className="spin" />
                Removing…
              </>
            ) : (
              <>
                <Icon name="trash" size={16} />
                Remove person
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
