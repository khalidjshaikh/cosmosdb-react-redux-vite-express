import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { UserFormDialog } from './UserFormDialog';
import { store } from '../store/store';

function renderDialog() {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  render(
    <Provider store={store}>
      <UserFormDialog user={null} onClose={onClose} onSaved={onSaved} />
    </Provider>,
  );

  return { onClose, onSaved };
}

describe('UserFormDialog', () => {
  it('shows validation errors instead of submitting an empty form', async () => {
    const user = userEvent.setup();
    const { onSaved } = renderDialog();

    await user.click(screen.getByRole('button', { name: /add person/i }));

    expect(await screen.findByText('First name is required.')).toBeInTheDocument();
    expect(screen.getByText('Last name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('closes with the cancel button', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('links each invalid field to its error message', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /add person/i }));

    const firstName = screen.getByLabelText('First name');
    expect(firstName).toHaveAttribute('aria-invalid', 'true');
    expect(firstName).toHaveAccessibleDescription('First name is required.');
  });
});
