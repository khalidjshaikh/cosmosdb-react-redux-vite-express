import { describe, expect, it } from 'vitest';
import { EMPTY_USER_FORM, formToPayload, validateUserForm } from './validation';

const validForm = {
  ...EMPTY_USER_FORM,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+44 20 7946 0000',
  department: 'Engineering',
  location: 'London, UK',
};

describe('validateUserForm', () => {
  it('accepts a complete form', () => {
    expect(validateUserForm(validForm)).toEqual({});
  });

  it('requires first name, last name and a valid email', () => {
    const errors = validateUserForm({
      ...EMPTY_USER_FORM,
      firstName: ' ',
      lastName: '',
      email: 'not-an-email',
    });

    expect(errors.firstName).toMatch(/required/i);
    expect(errors.lastName).toMatch(/required/i);
    expect(errors.email).toMatch(/valid email/i);
  });

  it('rejects malformed phone numbers and oversized fields', () => {
    const errors = validateUserForm({
      ...validForm,
      phone: 'call me',
      notes: 'x'.repeat(1001),
    });

    expect(errors.phone).toMatch(/valid phone/i);
    expect(errors.notes).toMatch(/1000/);
  });

  it('trims values when building the API payload', () => {
    const payload = formToPayload({
      ...validForm,
      firstName: '  Ada ',
      lastName: ' Lovelace  ',
      email: ' ada@example.com ',
      department: ' Engineering ',
    });

    expect(payload).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      department: 'Engineering',
    });
  });
});
