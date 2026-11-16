import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, ScryptOptions, timingSafeEqual } from 'node:crypto';

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, keylen, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

/**
 * Password hashing with scrypt (memory-hard, built into Node.js — no native add-on).
 * Format: scrypt$N$r$p$saltBase64$hashBase64
 */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await scrypt(password, salt, KEY_LENGTH, PARAMS);
    return [
      'scrypt',
      PARAMS.N,
      PARAMS.r,
      PARAMS.p,
      salt.toString('base64'),
      key.toString('base64'),
    ].join('$');
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [algorithm, n, r, p, salt, hash] = stored.split('$');
    if (algorithm !== 'scrypt' || !salt || !hash) return false;

    const expected = Buffer.from(hash, 'base64');
    const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
