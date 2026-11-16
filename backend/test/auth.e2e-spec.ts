import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { createTestApp, signUp } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('register', () => {
    it('creates an account, sets a secure cookie and never returns secrets', async () => {
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ name: '  Zakariae ', email: 'Zak@Example.com', password: 'Secret123' })
        .expect(201);

      expect(res.body).toEqual({
        user: {
          id: expect.any(String),
          email: 'zak@example.com',
          name: 'Zakariae',
          createdAt: expect.any(String),
        },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password|token/i);

      const cookie = res.get('Set-Cookie')?.[0] ?? '';
      expect(cookie).toMatch(/^kanban_token=/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
    });

    it('stores a salted scrypt hash, never the password', async () => {
      await http()
        .post('/api/v1/auth/register')
        .send({ name: 'Hash', email: 'hash@example.com', password: 'Secret123' })
        .expect(201);

      const user = await app
        .get(DataSource)
        .getRepository(User)
        .createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email: 'hash@example.com' })
        .getOneOrFail();

      expect(user.passwordHash).toMatch(/^scrypt\$16384\$8\$1\$/);
      expect(user.passwordHash).not.toContain('Secret123');
    });

    it('gives every new account a starter board in its language', async () => {
      const { agent: en } = await signUp(app);
      const { agent: fr } = await signUp(app, { locale: 'fr' });

      const [enBoards, frBoards] = await Promise.all([
        en.get('/api/v1/boards').expect(200),
        fr.get('/api/v1/boards').expect(200),
      ]);
      expect(enBoards.body).toEqual([{ id: expect.any(String), name: 'My first board' }]);
      expect(frBoards.body).toEqual([{ id: expect.any(String), name: 'Mon premier tableau' }]);

      const board = await en.get(`/api/v1/boards/${enBoards.body[0].id}`).expect(200);
      expect(board.body.columns.map((c: { name: string }) => c.name)).toEqual([
        'Todo',
        'Doing',
        'Done',
      ]);
    });

    it('rejects a duplicate email, whatever its case', async () => {
      await signUp(app, { email: 'taken@example.com' });

      await http()
        .post('/api/v1/auth/register')
        .send({ name: 'Other', email: 'TAKEN@example.com', password: 'Secret123' })
        .expect(409);
    });

    it.each([
      ['a short password', { password: 'Ab1' }],
      ['a password without digits', { password: 'onlyletters' }],
      ['a password without letters', { password: '12345678' }],
      ['an invalid email', { email: 'not-an-email' }],
      ['an empty name', { name: '   ' }],
      ['an unknown locale', { locale: 'de' }],
      ['unexpected fields', { isAdmin: true }],
    ])('rejects %s', async (_label, override) => {
      await http()
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid',
          email: `valid-${Math.random()}@example.com`,
          password: 'Secret123',
          ...override,
        })
        .expect(400);
    });
  });

  describe('login', () => {
    beforeAll(async () => {
      await signUp(app, { email: 'login@example.com', password: 'Secret123' });
    });

    it('logs in with the right credentials (email is case-insensitive)', async () => {
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: ' LOGIN@example.com ', password: 'Secret123' })
        .expect(200);

      expect(res.body.user.email).toBe('login@example.com');
      expect(res.get('Set-Cookie')?.[0]).toMatch(/kanban_token=.+; .*HttpOnly/);
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const wrongPassword = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Wrong1234' })
        .expect(401);
      const unknownEmail = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Wrong1234' })
        .expect(401);

      expect(wrongPassword.body.message).toBe('Invalid email or password.');
      expect(unknownEmail.body).toEqual(wrongPassword.body);
      expect(wrongPassword.get('Set-Cookie')).toBeUndefined();
    });
  });

  describe('session', () => {
    it('returns the current user from the cookie', async () => {
      const { agent, user } = await signUp(app);

      const res = await agent.get('/api/v1/auth/me').expect(200);
      expect(res.body).toEqual({ ...user, createdAt: expect.any(String) });
    });

    it('requires authentication on protected routes', async () => {
      await http().get('/api/v1/auth/me').expect(401);
      await http().get('/api/v1/boards').expect(401);
      await http().post('/api/v1/boards').send({ name: 'x' }).expect(401);
    });

    it('rejects forged, tampered and expired tokens', async () => {
      const { user } = await signUp(app);
      const jwt = app.get(JwtService);

      const forged = await new JwtService({
        secret: 'another-secret-another-secret-123456',
      }).signAsync({
        sub: user.id,
      });
      const valid = await jwt.signAsync({ sub: user.id });
      const tampered = valid.slice(0, -2) + (valid.endsWith('AA') ? 'BB' : 'AA');
      const expired = await jwt.signAsync({ sub: user.id }, { expiresIn: -10 });
      const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
        JSON.stringify({ sub: user.id }),
      ).toString('base64url')}.`;

      for (const token of [forged, tampered, expired, noneAlg, 'garbage']) {
        await http().get('/api/v1/auth/me').set('Cookie', `kanban_token=${token}`).expect(401);
      }
      await http().get('/api/v1/auth/me').set('Cookie', `kanban_token=${valid}`).expect(200);
    });

    it('ignores tokens sent in the Authorization header', async () => {
      const { user } = await signUp(app);
      const token = await app.get(JwtService).signAsync({ sub: user.id });

      await http().get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('rejects the token of a deleted account', async () => {
      const { agent, user } = await signUp(app);
      await app.get(DataSource).getRepository(User).delete(user.id);

      await agent.get('/api/v1/auth/me').expect(401);
    });

    it('logs out by clearing the cookie', async () => {
      const { agent } = await signUp(app);

      const res = await agent.post('/api/v1/auth/logout').expect(204);
      expect(res.get('Set-Cookie')?.[0]).toMatch(/kanban_token=;.*Expires=Thu, 01 Jan 1970/);
      await agent.get('/api/v1/auth/me').expect(401);
    });
  });

  describe('hardening', () => {
    it('sends security headers', async () => {
      const res = await http().get('/api/v1/health').expect(200);

      expect(res.body).toEqual({ status: 'ok' });
      expect(res.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(res.get('Content-Security-Policy')).toBeDefined();
      expect(res.get('X-Powered-By')).toBeUndefined();
    });

    it('only allows the configured frontend origin to use credentials', async () => {
      const allowed = await http()
        .options('/api/v1/boards')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');
      expect(allowed.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
      expect(allowed.get('Access-Control-Allow-Credentials')).toBe('true');

      const blocked = await http()
        .options('/api/v1/boards')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'POST');
      expect(blocked.get('Access-Control-Allow-Origin')).toBeUndefined();
    });
  });
});

describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp({ THROTTLE_AUTH_LIMIT: '3' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks repeated login attempts but leaves other routes alone', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'brute@example.com', password: 'Guess1234' });

    for (let i = 0; i < 3; i++) await attempt().expect(401);
    await attempt().expect(429);

    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});
