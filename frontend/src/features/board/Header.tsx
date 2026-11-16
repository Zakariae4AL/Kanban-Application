import { useState } from 'react';
import type { BoardSummary } from '../../api/types';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { LogoMark } from '../../components/Logo';
import { Menu } from '../../components/Menu';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ChevronDown, PlusIcon } from '../../components/icons';
import { useI18n } from '../../i18n/I18nProvider';
import { BoardList } from './BoardList';

type Props = {
  boardName?: string;
  boards: BoardSummary[];
  canAddTask: boolean;
  hasBoard: boolean;
  onAddTask: () => void;
  onEditBoard: () => void;
  onDeleteBoard: () => void;
  onCreateBoard: () => void;
  onLogout: () => void;
};

export function Header(props: Props) {
  const { t } = useI18n();
  const [mobileMenu, setMobileMenu] = useState(false);

  const menuItems = [
    ...(props.hasBoard
      ? [
          { label: t('header.editBoard'), onSelect: props.onEditBoard },
          { label: t('header.deleteBoard'), onSelect: props.onDeleteBoard, danger: true },
        ]
      : []),
    { label: t('header.logout'), onSelect: props.onLogout },
  ];

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white px-4 md:h-20 md:px-6 lg:h-24 dark:border-line-dark dark:bg-surface-dark">
      <LogoMark className="md:hidden" />

      {/* Mobile: the board name opens the board list. */}
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 md:hidden"
        aria-expanded={mobileMenu}
        aria-label={t('header.chooseBoard')}
        onClick={() => setMobileMenu((open) => !open)}
      >
        <span className="truncate text-lg font-bold">{props.boardName ?? t('app.name')}</span>
        <ChevronDown className={`shrink-0 text-accent-text transition-transform ${mobileMenu ? 'rotate-180' : ''}`} />
      </button>
      <h1 className="hidden truncate text-xl font-bold md:block lg:text-2xl">{props.boardName}</h1>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <button
          type="button"
          className="btn-primary px-4 md:px-6 md:py-3.5 md:text-[15px]"
          disabled={!props.canAddTask}
          onClick={props.onAddTask}
          aria-label={t('header.addTaskShort')}
        >
          <PlusIcon className="md:hidden" />
          <span className="hidden md:inline">{t('header.addTask')}</span>
        </button>
        <Menu label={t('header.boardMenu')} items={menuItems} />
      </div>

      {mobileMenu && (
        <>
          <div className="fixed inset-0 top-16 z-30 bg-black/50 md:hidden" onClick={() => setMobileMenu(false)} />
          <div className="absolute top-20 left-1/2 z-40 w-[264px] -translate-x-1/2 rounded-lg bg-white py-4 shadow-xl md:hidden dark:bg-surface-dark">
            <BoardList
              boards={props.boards}
              onNavigate={() => setMobileMenu(false)}
              onCreate={() => {
                setMobileMenu(false);
                props.onCreateBoard();
              }}
            />
            <div className="mt-4 space-y-3 px-4">
              <ThemeToggle />
              <div className="flex justify-center">
                <LanguageSwitch />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
