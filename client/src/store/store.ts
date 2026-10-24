import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { notificationsReducer } from '../features/notifications/notificationsSlice';
import { uiReducer } from '../features/ui/uiSlice';
import { usersApi } from '../features/users/usersApi';
import { usersReducer } from '../features/users/usersSlice';

export const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    users: usersReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(usersApi.middleware),
});

// Enables refetchOnFocus / refetchOnReconnect behaviour for API queries.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
