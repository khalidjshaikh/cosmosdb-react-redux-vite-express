import { useGetUserStatsQuery } from '../features/users/usersApi';
import { formatNumber } from '../features/users/format';
import type { IconName } from './Icon';
import { Icon } from './Icon';

interface StatCard {
  key: 'total' | 'active' | 'admins' | 'newThisMonth';
  label: string;
  hint: string;
  icon: IconName;
  tone: 'blue' | 'green' | 'violet' | 'amber';
}

const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());

const CARDS: StatCard[] = [
  { key: 'total', label: 'Total people', hint: 'in the directory', icon: 'users', tone: 'blue' },
  { key: 'active', label: 'Active', hint: 'can sign in today', icon: 'userCheck', tone: 'green' },
  { key: 'admins', label: 'Admins', hint: 'full workspace access', icon: 'shield', tone: 'violet' },
  {
    key: 'newThisMonth',
    label: 'New this month',
    hint: `joined in ${currentMonth}`,
    icon: 'trend',
    tone: 'amber',
  },
];

export function StatsCards() {
  const { data, isLoading, isError } = useGetUserStatsQuery();

  return (
    <section className="stats-grid" aria-label="Directory statistics" aria-busy={isLoading}>
      {CARDS.map((card) => (
        <article className={`stat-card stat-${card.tone}`} key={card.key}>
          <div className="stat-icon">
            <Icon name={card.icon} size={19} />
          </div>
          <div className="stat-copy">
            <span className="stat-label">{card.label}</span>
            {isLoading ? (
              <span className="skeleton skeleton-value" aria-hidden="true" />
            ) : (
              <span className="stat-value">
                {isError || !data ? '—' : formatNumber(data[card.key])}
              </span>
            )}
            <span className="stat-hint">{card.hint}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
