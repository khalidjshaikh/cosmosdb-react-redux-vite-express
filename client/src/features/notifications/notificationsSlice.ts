import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationTone = 'success' | 'error' | 'info';

export interface AppNotification {
  id: string;
  tone: NotificationTone;
  title: string;
  description?: string;
}

export interface NotificationsState {
  items: AppNotification[];
}

const initialState: NotificationsState = { items: [] };

type NotificationInput = Omit<AppNotification, 'id'>;

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notify: {
      reducer(state, action: PayloadAction<AppNotification>) {
        state.items.unshift(action.payload);
        // Keep the stack short; older toasts auto-dismiss anyway.
        state.items = state.items.slice(0, 4);
      },
      prepare(input: NotificationInput) {
        return { payload: { ...input, id: nanoid() } };
      },
    },
    dismiss(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearNotifications(state) {
      state.items = [];
    },
  },
});

export const { notify, dismiss, clearNotifications } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;
