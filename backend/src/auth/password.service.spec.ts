import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with scrypt, a random salt and a self-describing format', async () => {
    const a = await service.hash('Secret123');
    const b = await service.hash('Secret123');

    expect(a).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b); // different salts
    expect(a).not.toContain('Secret123');
  });

  it('verifies the right password only', async () => {
    const hash = await service.hash('Secret123');

    await expect(service.verify('Secret123', hash)).resolves.toBe(true);
    await expect(service.verify('secret123', hash)).resolves.toBe(false);
    await expect(service.verify('', hash)).resolves.toBe(false);
  });

  it.each(['', 'plain-text', 'bcrypt$10$abc', 'scrypt$16384$8$1$$'])(
    'rejects a malformed stored hash (%p) without throwing',
    async (stored) => {
      await expect(service.verify('Secret123', stored)).resolves.toBe(false);
    },
  );
});
