import type { ReactNode } from 'react';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { Logo } from '../../components/Logo';
import { useI18n } from '../../i18n/I18nProvider';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <LanguageSwitch />
        </div>
        <section className="rounded-lg bg-white p-8 shadow-[0_4px_6px_rgba(54,78,126,0.1)] dark:bg-surface-dark">
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="mt-1 mb-6 text-[13px] text-muted">{t('app.tagline')}</p>
          {children}
        </section>
      </div>
    </main>
  );
}
