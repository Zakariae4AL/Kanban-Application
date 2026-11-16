import { useId } from 'react';
import type { Column } from '../api/types';
import { ChevronDown } from './icons';

/** Native <select> styled like the design: keyboard and screen-reader friendly. */
export function StatusSelect({
  label,
  columns,
  value,
  onChange,
  disabled,
}: {
  label: string;
  columns: Pick<Column, 'id' | 'name'>[];
  value: string;
  onChange: (columnId: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="input cursor-pointer appearance-none pr-10 dark:bg-surface-dark"
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-accent-text" />
      </div>
    </div>
  );
}
