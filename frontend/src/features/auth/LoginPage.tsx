import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorStatus, useLoginMutation } from '../../api/api';
import { useSession } from '../../api/useSession';
import { TextField } from '../../components/Field';
import { useI18n } from '../../i18n/I18nProvider';
import { AuthLayout } from './AuthLayout';
import { DEMO, validateLogin, type Errors } from './validation';

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: me } = useSession();
  const [login, { isLoading }] = useLoginMutation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors<'email' | 'password'>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (me) return <Navigate to="/boards" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    try {
      await login({ email: values.email.trim(), password: values.password }).unwrap();
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/boards', { replace: true });
    } catch (error) {
      const status = errorStatus(error);
      setFormError(
        t(status === 401 ? 'auth.error.invalid' : status === 429 ? 'auth.error.tooMany' : 'error.generic'),
      );
    }
  };

  const set = (field: 'email' | 'password') => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  return (
    <AuthLayout title={t('auth.login.title')}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
          error={errors.email && t(errors.email)}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => set('password')(e.target.value)}
          error={errors.password && t(errors.password)}
        />
        {formError && (
          <p role="alert" className="rounded bg-danger/10 px-4 py-2 text-[13px] font-medium text-danger">
            {formError}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? t('auth.submitting') : t('auth.login.submit')}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => setValues(DEMO)}
        >
          {t('auth.demo')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to="/signup" className="font-bold text-accent-text hover:underline">
          {t('auth.login.toSignup')}
        </Link>
      </p>
    </AuthLayout>
  );
}
