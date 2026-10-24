import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  getApiErrorMessage,
  getApiFieldErrors,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '../features/users/usersApi';
import {
  EMPTY_USER_FORM,
  formToPayload,
  userToForm,
  validateUserForm,
  type UserFormErrors,
  type UserFormValues,
} from '../features/users/validation';
import {
  ROLE_LABELS,
  STATUS_LABELS,
  USER_ROLES,
  USER_STATUSES,
  type User,
  type UserRole,
  type UserStatus,
} from '../features/users/types';
import { Icon } from './Icon';

interface UserFormDialogProps {
  user: User | null;
  onClose: () => void;
  onSaved: (user: User, mode: 'created' | 'updated') => void;
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}

function Field({ label, htmlFor, error, full = false, children }: FieldProps) {
  return (
    <div className={`field${full ? ' field-full' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function UserFormDialog({ user, onClose, onSaved }: UserFormDialogProps) {
  const [values, setValues] = useState<UserFormValues>(() =>
    user ? userToForm(user) : { ...EMPTY_USER_FORM },
  );
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [createUser, createState] = useCreateUserMutation();
  const [updateUser, updateState] = useUpdateUserMutation();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const isSaving = createState.isLoading || updateState.isLoading;
  const isEditing = Boolean(user);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, isSaving]);

  function setField<Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateUserForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = formToPayload(values);

    try {
      if (user) {
        const saved = await updateUser({
          id: user.id,
          changes: payload,
          etag: user.etag,
        }).unwrap();
        onSaved(saved, 'updated');
      } else {
        const saved = await createUser(payload).unwrap();
        onSaved(saved, 'created');
      }
    } catch (error) {
      const apiFields = getApiFieldErrors(error) as UserFormErrors;
      if (Object.keys(apiFields).length > 0) {
        setErrors((current) => ({ ...current, ...apiFields }));
      }
      setFormError(getApiErrorMessage(error));
    }
  }

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-dialog-title"
      >
        <header className="dialog-header">
          <div>
            <h2 id="user-dialog-title">{isEditing ? 'Edit person' : 'Add a person'}</h2>
            <p>
              {isEditing
                ? 'Update their profile details and access level.'
                : 'Create a profile for someone in your workspace.'}
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSaving}
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="dialog-body">
            {formError ? (
              <div className="form-alert" role="alert">
                <Icon name="alert" size={17} />
                <span>{formError}</span>
              </div>
            ) : null}

            <div className="form-grid">
              <Field label="First name" htmlFor="firstName" error={errors.firstName}>
                <input
                  ref={firstFieldRef}
                  id="firstName"
                  className={`input${errors.firstName ? ' is-invalid' : ''}`}
                  value={values.firstName}
                  onChange={(event) => setField('firstName', event.target.value)}
                  autoComplete="given-name"
                  placeholder="Ada"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
              </Field>

              <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
                <input
                  id="lastName"
                  className={`input${errors.lastName ? ' is-invalid' : ''}`}
                  value={values.lastName}
                  onChange={(event) => setField('lastName', event.target.value)}
                  autoComplete="family-name"
                  placeholder="Lovelace"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                />
              </Field>

              <Field label="Email" htmlFor="email" error={errors.email} full>
                <input
                  id="email"
                  type="email"
                  className={`input${errors.email ? ' is-invalid' : ''}`}
                  value={values.email}
                  onChange={(event) => setField('email', event.target.value)}
                  autoComplete="email"
                  placeholder="ada@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </Field>

              <Field label="Phone" htmlFor="phone" error={errors.phone}>
                <input
                  id="phone"
                  className={`input${errors.phone ? ' is-invalid' : ''}`}
                  value={values.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  autoComplete="tel"
                  placeholder="+1 415 555 0132"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
              </Field>

              <Field label="Department" htmlFor="department" error={errors.department}>
                <input
                  id="department"
                  className={`input${errors.department ? ' is-invalid' : ''}`}
                  value={values.department}
                  onChange={(event) => setField('department', event.target.value)}
                  autoComplete="organization"
                  placeholder="Platform Engineering"
                  aria-invalid={Boolean(errors.department)}
                  aria-describedby={errors.department ? 'department-error' : undefined}
                />
              </Field>

              <Field label="Location" htmlFor="location" error={errors.location} full>
                <input
                  id="location"
                  className={`input${errors.location ? ' is-invalid' : ''}`}
                  value={values.location}
                  onChange={(event) => setField('location', event.target.value)}
                  autoComplete="address-level2"
                  placeholder="San Francisco, US"
                  aria-invalid={Boolean(errors.location)}
                  aria-describedby={errors.location ? 'location-error' : undefined}
                />
              </Field>

              <Field label="Role" htmlFor="role" error={errors.role}>
                <span className="select-control">
                  <select
                    id="role"
                    className="select select-block"
                    value={values.role}
                    onChange={(event) => setField('role', event.target.value as UserRole)}
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={15} className="select-chevron" />
                </span>
              </Field>

              <Field label="Status" htmlFor="status" error={errors.status}>
                <span className="select-control">
                  <select
                    id="status"
                    className="select select-block"
                    value={values.status}
                    onChange={(event) => setField('status', event.target.value as UserStatus)}
                  >
                    {USER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={15} className="select-chevron" />
                </span>
              </Field>

              <Field label="Notes" htmlFor="notes" error={errors.notes} full>
                <textarea
                  id="notes"
                  className="input textarea"
                  rows={3}
                  value={values.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  placeholder="Anything useful for the team to know…"
                />
              </Field>
            </div>
          </div>

          <footer className="dialog-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icon name="spinner" size={16} className="spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon name={isEditing ? 'check' : 'plus'} size={16} />
                  {isEditing ? 'Save changes' : 'Add person'}
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
