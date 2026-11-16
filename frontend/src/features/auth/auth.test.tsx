import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db, resetDb } from '../../test/fakeApi';
import { renderApp } from '../../test/render';
import { validateLogin, validateSignup } from './validation';

describe('validation', () => {
  it('validates the login form', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'validation.required',
      password: 'validation.required',
    });
    expect(validateLogin({ email: 'nope', password: 'x' })).toEqual({ email: 'validation.email' });
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
  });

  it('validates the signup form like the API does', () => {
    expect(validateSignup({ name: ' ', email: 'a@b.co', password: 'short1', confirm: 'short1' })).toEqual({
      name: 'validation.required',
      password: 'validation.password',
    });
    expect(validateSignup({ name: 'A', email: 'a@b.co', password: 'onlyletters', confirm: 'onlyletters' }).password).toBe(
      'validation.password',
    );
    expect(validateSignup({ name: 'A', email: 'a@b.co', password: 'Secret123', confirm: 'Secret124' })).toEqual({
      confirm: 'validation.passwordMatch',
    });
    expect(validateSignup({ name: 'A', email: 'a@b.co', password: 'Secret123', confirm: 'Secret123' })).toEqual({});
  });
});

describe('login', () => {
  it('redirects visitors to the login page', async () => {
    resetDb({ loggedIn: false });
    renderApp('/boards');

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
  });

  it('logs in with the demo account and opens the first board', async () => {
    resetDb({ loggedIn: false });
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('button', { name: 'Try the demo account' }));
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Platform Launch' })).toBeInTheDocument();
    expect(db.calls).toContain('POST /auth/login');
  });

  it('shows field errors before calling the API', async () => {
    resetDb({ loggedIn: false });
    const { user } = renderApp('/login');

    await user.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText("Can't be empty")).toHaveLength(2);
    expect(db.calls).not.toContain('POST /auth/login');
  });

  it('explains wrong credentials and rate limiting', async () => {
    resetDb({ loggedIn: false });
    const { user } = renderApp('/login');

    await user.type(await screen.findByLabelText('Email'), 'demo@kanban.dev');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'blocked@kanban.dev');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });
});

describe('signup', () => {
  it('creates an account in the chosen language', async () => {
    resetDb({ loggedIn: false });
    const { user } = renderApp('/signup', { locale: 'fr' });

    await user.type(await screen.findByLabelText('Nom'), 'Zakariae');
    await user.type(screen.getByLabelText('E-mail'), 'zak@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'Secret123');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Mon premier tableau' })).toBeInTheDocument();
  });

  it('flags an email that is already used', async () => {
    resetDb({ loggedIn: false });
    const { user } = renderApp('/signup');

    await user.type(await screen.findByLabelText('Name'), 'Someone');
    await user.type(screen.getByLabelText('Email'), 'taken@kanban.dev');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.type(screen.getByLabelText('Confirm password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('An account already exists with this email.');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('session', () => {
  it('logs out from the board menu', async () => {
    const { user } = renderApp('/boards');
    await screen.findByRole('heading', { level: 1, name: 'Platform Launch' });

    await user.click(screen.getByRole('button', { name: 'Board options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(db.loggedIn).toBe(false);
  });

  it('goes back to the login page when the session expires', async () => {
    const { user } = renderApp('/boards');
    await screen.findByRole('heading', { level: 1, name: 'Platform Launch' });

    db.loggedIn = false; // e.g. the cookie expired
    await user.click(screen.getByRole('link', { name: 'Marketing Plan' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument());
  });
});
