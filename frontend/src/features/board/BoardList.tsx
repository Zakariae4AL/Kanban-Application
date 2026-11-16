import { NavLink } from 'react-router-dom';
import type { BoardSummary } from '../../api/types';
import { BoardIcon } from '../../components/icons';
import { useI18n } from '../../i18n/I18nProvider';

/** Board navigation shared by the sidebar (desktop) and the dropdown (mobile). */
export function BoardList({
  boards,
  onCreate,
  onNavigate,
}: {
  boards: BoardSummary[];
  onCreate: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const item =
    'flex w-full items-center gap-3 rounded-r-full px-6 py-3.5 text-[15px] font-bold transition-colors md:px-8';

  return (
    <nav aria-label={t('sidebar.allBoards', { count: boards.length })}>
      <h2 className="mb-5 px-6 text-xs font-bold tracking-[0.2em] text-muted uppercase md:px-8">
        {t('sidebar.allBoards', { count: boards.length })}
      </h2>
      <ul className="mr-6">
        {boards.map((board) => (
          <li key={board.id}>
            <NavLink
              to={`/boards/${board.id}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${item} ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-accent/10 hover:text-accent-text dark:hover:bg-white'
                }`
              }
            >
              <BoardIcon />
              <span className="truncate">{board.name}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onCreate}
            className={`${item} text-accent-text hover:bg-accent/10 dark:hover:bg-white`}
          >
            <BoardIcon />
            {t('sidebar.createBoard')}
          </button>
        </li>
      </ul>
    </nav>
  );
}
