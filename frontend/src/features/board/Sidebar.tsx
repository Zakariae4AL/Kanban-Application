import type { BoardSummary } from '../../api/types';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { EyeIcon, EyeSlashIcon } from '../../components/icons';
import { useI18n } from '../../i18n/I18nProvider';
import { BoardList } from './BoardList';

type Props = {
  boards: BoardSummary[];
  open: boolean;
  onToggle: () => void;
  onCreateBoard: () => void;
};

export function Sidebar({ boards, open, onToggle, onCreateBoard }: Props) {
  const { t } = useI18n();

  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={t('sidebar.show')}
        className="fixed bottom-8 left-0 z-30 hidden h-12 w-14 items-center justify-center rounded-r-full bg-accent text-white hover:bg-accent-hover md:flex"
      >
        <EyeIcon />
      </button>
    );
  }

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-line bg-white md:flex lg:w-[300px] dark:border-line-dark dark:bg-surface-dark">
      <div className="px-6 py-8 md:px-8">
        <Logo />
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto pt-4">
        <BoardList boards={boards} onCreate={onCreateBoard} />
      </div>
      <div className="space-y-4 px-3 pb-8 lg:px-6">
        <ThemeToggle />
        <div className="flex justify-center">
          <LanguageSwitch />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-r-full px-5 py-3 text-[15px] font-bold text-muted hover:bg-accent/10 hover:text-accent-text dark:hover:bg-white"
        >
          <EyeSlashIcon />
          {t('sidebar.hide')}
        </button>
      </div>
    </aside>
  );
}
