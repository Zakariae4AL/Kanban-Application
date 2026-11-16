import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from './I18nProvider';
import { messages } from './messages';

describe('i18n', () => {
  it('has a French translation for every English message', () => {
    expect(Object.keys(messages.fr).sort()).toEqual(Object.keys(messages.en).sort());
    for (const value of Object.values(messages.fr)) expect(value.trim()).not.toBe('');
  });

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      expect(placeholders(messages.fr[key]), key).toEqual(placeholders(messages.en[key]));
    }
  });

  it('interpolates parameters', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: ({ children }) => <I18nProvider locale="fr">{children}</I18nProvider>,
    });
    expect(result.current.t('task.subtasksDone', { done: 1, total: 3 })).toBe('1 sur 3 sous-tâches');
  });
});
