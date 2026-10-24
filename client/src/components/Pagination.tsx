import { useAppDispatch, useAppSelector } from '../store/hooks';
import { pageRange } from '../features/users/format';
import { setPage, setPageSize } from '../features/users/usersSlice';
import { selectUserFilters } from '../store/selectors';
import { Icon } from './Icon';

interface PaginationProps {
  total: number;
  totalPages: number;
  isFetching: boolean;
}

function buildPageItems(current: number, total: number): Array<number | string> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const items: Array<number | string> = [];
  let previous = 0;

  for (const page of pages) {
    if (previous && page - previous > 1) items.push(`gap-${previous}`);
    items.push(page);
    previous = page;
  }

  return items;
}

export function Pagination({ total, totalPages, isFetching }: PaginationProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectUserFilters);
  const pages = buildPageItems(filters.page, totalPages);

  return (
    <footer className="pagination">
      <div className="pagination-summary" aria-live="polite">
        {pageRange(filters.page, filters.pageSize, total)}
        {isFetching ? <Icon name="spinner" size={13} className="spin" /> : null}
      </div>

      <div className="pagination-controls">
        <label className="page-size">
          <span>Rows</span>
          <span className="select-control">
            <select
              className="select select-sm"
              aria-label="Rows per page"
              value={filters.pageSize}
              onChange={(event) => dispatch(setPageSize(Number(event.target.value)))}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={14} className="select-chevron" />
          </span>
        </label>

        <nav className="page-buttons" aria-label="Pagination">
          <button
            type="button"
            className="page-button"
            onClick={() => dispatch(setPage(filters.page - 1))}
            disabled={filters.page <= 1}
            aria-label="Previous page"
          >
            <Icon name="chevronLeft" size={16} />
          </button>

          {pages.map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                className={`page-button ${item === filters.page ? 'is-current' : ''}`}
                onClick={() => dispatch(setPage(item))}
                aria-label={`Page ${item}`}
                aria-current={item === filters.page ? 'page' : undefined}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="page-gap" aria-hidden="true">
                …
              </span>
            ),
          )}

          <button
            type="button"
            className="page-button"
            onClick={() => dispatch(setPage(filters.page + 1))}
            disabled={filters.page >= totalPages}
            aria-label="Next page"
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </nav>
      </div>
    </footer>
  );
}
