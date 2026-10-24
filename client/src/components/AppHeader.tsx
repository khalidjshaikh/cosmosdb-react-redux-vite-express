import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGetHealthQuery } from '../features/users/usersApi';
import { toggleTheme } from '../features/ui/uiSlice';
import { selectTheme } from '../store/selectors';
import { Icon } from './Icon';

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="brand-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#brand-gradient)" />
      <circle cx="16" cy="16" r="9" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="4" ry="9" stroke="#fff" strokeWidth="1.5" />
      <circle cx="23.5" cy="9.5" r="2.2" fill="#fff" />
    </svg>
  );
}

function HealthPill() {
  const { data, isLoading, isError } = useGetHealthQuery(undefined, {
    pollingInterval: 60_000,
    refetchOnFocus: true,
  });

  const isMemory = data?.store === 'memory';
  const state = isError || data?.status === 'degraded' ? 'down' : data ? 'up' : 'pending';
  const label = isLoading
    ? 'Connecting…'
    : state === 'up'
      ? isMemory
        ? 'Memory store'
        : `Cosmos ${data?.cosmos.latencyMs ?? 0} ms`
      : isMemory
        ? 'Memory store offline'
        : 'Cosmos offline';

  return (
    <span
      className={`health-pill health-${state}`}
      title={
        state === 'down'
          ? isMemory
            ? 'The in-memory store is unavailable.'
            : 'The API cannot reach Azure Cosmos DB. Check the server logs.'
          : isMemory
            ? 'Demo data held in memory; it resets when the API restarts.'
            : 'Live connectivity check against Azure Cosmos DB'
      }
      role="status"
    >
      <span className="health-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function AppHeader() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { data: health } = useGetHealthQuery();

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <BrandMark />
          <div className="brand-copy">
            <span className="brand-name">People</span>
            <span className="brand-tagline">
              {health?.store === 'memory' ? 'In-memory demo store' : 'Azure Cosmos DB directory'}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <HealthPill />
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={() => dispatch(toggleTheme())}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
