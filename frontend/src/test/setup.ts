import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetDb, server } from './fakeApi';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => resetDb());
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.className = '';
});
afterAll(() => server.close());
