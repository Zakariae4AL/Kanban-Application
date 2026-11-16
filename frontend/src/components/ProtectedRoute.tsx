import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../api/useSession';
import { useI18n } from '../i18n/I18nProvider';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  const { t } = useI18n();
  const location = useLocation();

  if (isLoading) {
    return <p className="grid h-full place-items-center text-muted">{t('common.loading')}</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
