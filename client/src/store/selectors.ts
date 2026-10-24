import type { RootState } from './store';

export const selectTheme = (state: RootState) => state.ui.theme;

export const selectNotifications = (state: RootState) => state.notifications.items;

export const selectUserFilters = (state: RootState) => state.users;

export const selectHasActiveFilters = (state: RootState) =>
  state.users.search.trim().length > 0 ||
  state.users.role !== 'all' ||
  state.users.status !== 'all';
