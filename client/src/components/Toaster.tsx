import { useEffect } from 'react';
import {
  dismiss,
  type AppNotification,
} from '../features/notifications/notificationsSlice';
import { selectNotifications } from '../store/selectors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Icon, type IconName } from './Icon';

const ICONS: Record<AppNotification['tone'], IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info',
};

const AUTO_DISMISS_MS = 5000;

function Toast({ notification }: { notification: AppNotification }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = window.setTimeout(
      () => dispatch(dismiss(notification.id)),
      AUTO_DISMISS_MS,
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, notification.id]);

  return (
    <div
      className={`toast toast-${notification.tone}`}
      role={notification.tone === 'error' ? 'alert' : 'status'}
    >
      <span className="toast-icon" aria-hidden="true">
        <Icon name={ICONS[notification.tone]} size={19} />
      </span>
      <div className="toast-copy">
        <strong>{notification.title}</strong>
        {notification.description ? <span>{notification.description}</span> : null}
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => dispatch(dismiss(notification.id))}
        aria-label="Dismiss notification"
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  );
}

export function Toaster() {
  const notifications = useAppSelector(selectNotifications);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
