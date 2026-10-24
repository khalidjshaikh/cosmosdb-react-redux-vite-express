import { useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { Toaster } from './components/Toaster';
import { UsersPage } from './pages/UsersPage';
import { THEME_STORAGE_KEY } from './features/ui/uiSlice';
import { selectTheme } from './store/selectors';
import { useAppSelector } from './store/hooks';
import { useGetHealthQuery } from './features/users/usersApi';

export function App() {
  const theme = useAppSelector(selectTheme);
  const { data: health } = useGetHealthQuery();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures; the theme still applies for this session.
    }
  }, [theme]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content" className="shell">
        <UsersPage />
      </main>
      <footer className="app-footer">
        <span>People · React 19 + Redux Toolkit</span>
        <span className="footer-dot" aria-hidden="true">
          ·
        </span>
        <span>
          {health?.store === 'memory' ? 'In-memory store · ephemeral' : 'Azure Cosmos DB · NoSQL API'}
        </span>
      </footer>
      <Toaster />
    </div>
  );
}
