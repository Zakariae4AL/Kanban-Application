import { LOCALES, useI18n } from '../i18n/I18nProvider';

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t('lang.label')} className="inline-flex rounded-full bg-page p-1 dark:bg-page-dark">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            locale === code ? 'bg-accent text-white' : 'text-muted hover:text-accent-text'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
