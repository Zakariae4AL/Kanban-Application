import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes, Providers } from '../App';
import { makeStore } from '../app/store';
import { storage } from '../storage';

/** Renders the whole app at a URL with a fresh store (English by default). */
export function renderApp(route = '/boards', { locale = 'en' }: { locale?: 'en' | 'fr' } = {}) {
  storage.set('kanban.locale', locale);
  const store = makeStore();
  const user = userEvent.setup();
  const utils = render(
    <Providers store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );
  return { ...utils, user, store };
}
