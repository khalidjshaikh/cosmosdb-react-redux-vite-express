import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SortField, SortOrder, UserFilters, UserRole, UserStatus } from './types';

export const DEFAULT_FILTERS: UserFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  role: 'all',
  status: 'all',
  sort: 'createdAt',
  order: 'desc',
};

export interface SetSortPayload {
  sort: SortField;
  order: SortOrder;
}

const usersSlice = createSlice({
  name: 'users',
  initialState: DEFAULT_FILTERS,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setRole(state, action: PayloadAction<UserRole | 'all'>) {
      state.role = action.payload;
      state.page = 1;
    },
    setStatus(state, action: PayloadAction<UserStatus | 'all'>) {
      state.status = action.payload;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<SetSortPayload>) {
      state.sort = action.payload.sort;
      state.order = action.payload.order;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
    resetFilters(state) {
      return { ...DEFAULT_FILTERS, pageSize: state.pageSize };
    },
  },
});

export const { setSearch, setRole, setStatus, setSort, setPage, setPageSize, resetFilters } =
  usersSlice.actions;

export const usersReducer = usersSlice.reducer;
