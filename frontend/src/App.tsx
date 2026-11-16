import { Provider } from 'react-redux';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { makeStore, type AppStore } from './app/store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { BoardLayout } from './features/board/BoardLayout';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { ThemeProvider } from './theme/useTheme';

function NotFound() {
  const { t } = useI18n();
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
      <Link to="/boards" className="font-bold text-accent-text hover:underline">
        {t('notFound.back')}
      </Link>
    </main>
  );
}

export function AppRoutes() {
  const board = (
    <ProtectedRoute>
      <BoardLayout />
    </ProtectedRoute>
  );
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boards" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/boards" element={board} />
      <Route path="/boards/:boardId" element={board} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** All app-wide providers; tests reuse this with a memory router. */
export function Providers({ store, children }: { store: AppStore; children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </Provider>
  );
}

const store = makeStore();

export default function App() {
  return (
    <Providers store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}
