import { describe, expect, it } from 'vitest';
import { validateList } from './listValidation';

const items = (...values: string[]) => values.map((value, i) => ({ key: String(i), value }));

describe('validateList', () => {
  it('flags empty values', () => {
    const result = validateList(items('Todo', '  '), { required: 'req' });
    expect(result.valid).toBe(false);
    expect(result.items.map((i) => i.error)).toEqual([undefined, 'req']);
  });

  it('flags duplicates ignoring case and spaces, when asked to', () => {
    const result = validateList(items('Todo', ' todo '), { required: 'req', duplicate: 'dup' });
    expect(result.items.map((i) => i.error)).toEqual([undefined, 'dup']);
    expect(validateList(items('A', 'a'), { required: 'req' }).valid).toBe(true);
  });

  it('accepts a clean list', () => {
    expect(validateList(items('Todo', 'Doing', 'Done'), { required: 'req', duplicate: 'dup' }).valid).toBe(true);
  });
});
