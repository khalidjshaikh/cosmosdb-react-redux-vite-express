import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  resetFilters,
  setPage,
  setPageSize,
  setRole,
  setSearch,
  setSort,
  setStatus,
  usersReducer,
} from './usersSlice';

describe('usersSlice', () => {
  it('starts with the default filters', () => {
    expect(usersReducer(undefined, { type: '@@init' })).toEqual(DEFAULT_FILTERS);
  });

  it('resets to page 1 whenever a filter changes', () => {
    const onPageThree = { ...DEFAULT_FILTERS, page: 3 };

    expect(usersReducer(onPageThree, setSearch('ada')).page).toBe(1);
    expect(usersReducer(onPageThree, setRole('admin')).page).toBe(1);
    expect(usersReducer(onPageThree, setStatus('invited')).page).toBe(1);
    expect(usersReducer(onPageThree, setSort({ sort: 'lastName', order: 'asc' })).page).toBe(1);
    expect(usersReducer(onPageThree, setPageSize(50)).page).toBe(1);
  });

  it('stores filters and sort order', () => {
    let state = usersReducer(DEFAULT_FILTERS, setSearch('grace'));
    state = usersReducer(state, setRole('manager'));
    state = usersReducer(state, setStatus('active'));
    state = usersReducer(state, setSort({ sort: 'lastName', order: 'asc' }));
    state = usersReducer(state, setPage(2));

    expect(state).toMatchObject({
      search: 'grace',
      role: 'manager',
      status: 'active',
      sort: 'lastName',
      order: 'asc',
      page: 2,
    });
  });

  it('never goes below page 1', () => {
    expect(usersReducer(DEFAULT_FILTERS, setPage(-4)).page).toBe(1);
  });

  it('clears filters but keeps the page size', () => {
    const state = usersReducer(
      { ...DEFAULT_FILTERS, page: 4, pageSize: 50, search: 'ada', role: 'admin' },
      resetFilters(),
    );

    expect(state).toEqual({ ...DEFAULT_FILTERS, pageSize: 50 });
  });
});
