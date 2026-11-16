import { useI18n } from '../i18n/I18nProvider';

/** Three columns of a board — the app's mark. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="24" height="25" viewBox="0 0 24 25" className={`text-accent-text ${className}`}>
      <g fill="currentColor">
        <rect width="6" height="25" rx="2" />
        <rect opacity=".75" x="9" width="6" height="25" rx="2" />
        <rect opacity=".5" x="18" width="6" height="25" rx="2" />
      </g>
    </svg>
  );
}

export function Logo({ hideWordmarkOnMobile = false }: { hideWordmarkOnMobile?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-4">
      <LogoMark />
      <span
        className={`text-[28px] font-extrabold tracking-tight text-ink dark:text-white ${
          hideWordmarkOnMobile ? 'hidden md:inline' : ''
        }`}
      >
        {t('app.name')}
      </span>
    </span>
  );
}
