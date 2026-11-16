import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/useTheme';
import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const dark = theme === 'dark';

  return (
    <div className="flex items-center justify-center gap-6 rounded-md bg-page py-3.5 text-muted dark:bg-page-dark">
      <SunIcon />
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={t('theme.toggle')}
        onClick={toggle}
        className="relative h-5 w-10 rounded-full bg-accent transition-colors hover:bg-accent-hover"
      >
        <span
          className={`absolute top-[3px] left-[3px] h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            dark ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <MoonIcon />
    </div>
  );
}
