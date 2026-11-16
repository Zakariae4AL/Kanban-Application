import { BadRequestException } from '@nestjs/common';
import { diffChildren } from './sync';

describe('diffChildren', () => {
  it('returns the existing ids missing from the new list', () => {
    expect(diffChildren(['a', 'b', 'c'], [{ id: 'c' }, {}, { id: 'a' }], 'column')).toEqual(['b']);
  });

  it('removes everything when the list is empty', () => {
    expect(diffChildren(['a', 'b'], [], 'column')).toEqual(['a', 'b']);
  });

  it('refuses ids that do not belong to the parent', () => {
    expect(() => diffChildren(['a'], [{ id: 'x' }], 'column')).toThrow(BadRequestException);
  });

  it('refuses the same id twice', () => {
    expect(() => diffChildren(['a'], [{ id: 'a' }, { id: 'a' }], 'subtask')).toThrow(
      'Duplicate subtask id: a',
    );
  });
});
