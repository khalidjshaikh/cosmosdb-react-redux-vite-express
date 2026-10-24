import {
  USER_ROLES,
  USER_STATUSES,
  type CreateUserPayload,
  type User,
  type UserRole,
  type UserStatus,
} from './types';

export interface UserFormValues {
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

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

export const EMPTY_USER_FORM: UserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  location: '',
  role: 'member',
  status: 'active',
  notes: '',
};

export function userToForm(user: User): UserFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    department: user.department,
    location: user.location,
    role: user.role,
    status: user.status,
    notes: user.notes,
  };
}

export function formToPayload(values: UserFormValues): CreateUserPayload {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    department: values.department.trim(),
    location: values.location.trim(),
    role: values.role,
    status: values.status,
    notes: values.notes.trim(),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+().\-\s]*$/;

export function validateUserForm(values: UserFormValues): UserFormErrors {
  const errors: UserFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  } else if (values.firstName.trim().length > 80) {
    errors.firstName = 'Keep it under 80 characters.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  } else if (values.lastName.trim().length > 80) {
    errors.lastName = 'Keep it under 80 characters.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (email.length > 254) {
    errors.email = 'Email is too long.';
  }

  if (values.phone.trim().length > 32) {
    errors.phone = 'Phone number is too long.';
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (values.department.trim().length > 80) {
    errors.department = 'Keep it under 80 characters.';
  }

  if (values.location.trim().length > 120) {
    errors.location = 'Keep it under 120 characters.';
  }

  if (values.notes.trim().length > 1000) {
    errors.notes = 'Notes must be under 1000 characters.';
  }

  if (!USER_ROLES.includes(values.role)) {
    errors.role = 'Choose a role.';
  }

  if (!USER_STATUSES.includes(values.status)) {
    errors.status = 'Choose a status.';
  }

  return errors;
}
