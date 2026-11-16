import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorStatus, useRegisterMutation } from '../../api/api';
import { useSession } from '../../api/useSession';
import { TextField } from '../../components/Field';
import { useI18n } from '../../i18n/I18nProvider';
import { AuthLayout } from './AuthLayout';
import { validateSignup, type Errors } from './validation';

type Values = { name: string; email: string; password: string; confirm: string };

export function SignupPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { user: me } = useSession();
  const [register, { isLoading }] = useRegisterMutation();
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors<keyof Values>>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (me) return <Navigate to="/boards" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateSignup(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        locale,
      }).unwrap();
      navigate('/boards', { replace: true });
    } catch (error) {
      const status = errorStatus(error);
      if (status === 409) setErrors({ email: 'validation.duplicate' });
      setFormError(
        t(status === 409 ? 'auth.error.emailTaken' : status === 429 ? 'auth.error.tooMany' : 'error.generic'),
      );
    }
  };

  const field = (name: keyof Values) => ({
    value: values[name],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      setErrors((er) => ({ ...er, [name]: undefined }));
    },
    error: errors[name] && t(errors[name]),
  });

  return (
    <AuthLayout title={t('auth.signup.title')}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField label={t('auth.name')} autoComplete="name" maxLength={80} {...field('name')} />
        <TextField label={t('auth.email')} type="email" autoComplete="email" {...field('email')} />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          hint={t('auth.passwordHint')}
          {...field('password')}
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          maxLength={72}
          {...field('confirm')}
        />
        {formError && (
          <p role="alert" className="rounded bg-danger/10 px-4 py-2 text-[13px] font-medium text-danger">
            {formError}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? t('auth.submitting') : t('auth.signup.submit')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted">
        {t('auth.signup.hasAccount')}{' '}
        <Link to="/login" className="font-bold text-accent-text hover:underline">
          {t('auth.signup.toLogin')}
        </Link>
      </p>
    </AuthLayout>
  );
}
