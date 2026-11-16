import { CrossIcon } from '../../../components/icons';

import type { ListItem } from './listValidation';

export type { ListItem };

/** Editable list of text inputs (board columns, task subtasks). */
export function ListEditor({
  label,
  items,
  placeholder,
  addLabel,
  removeLabel,
  max,
  maxLength,
  onChange,
}: {
  label: string;
  items: ListItem[];
  placeholder?: string;
  addLabel: string;
  removeLabel: (item: ListItem, index: number) => string;
  max: number;
  maxLength: number;
  onChange: (items: ListItem[]) => void;
}) {
  const update = (index: number, value: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, value, error: undefined } : item)));

  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.key} className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                aria-label={`${label} ${index + 1}`}
                aria-invalid={Boolean(item.error)}
                value={item.value}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(e) => update(index, e.target.value)}
                className={`input ${item.error ? 'input-error pr-28' : ''}`}
              />
              {item.error && (
                <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[13px] text-danger">{item.error}</span>
              )}
            </div>
            <button
              type="button"
              aria-label={removeLabel(item, index)}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className={`text-muted hover:text-danger ${item.error ? 'text-danger' : ''}`}
            >
              <CrossIcon />
            </button>
          </li>
        ))}
      </ul>
      {items.length < max && (
        <button
          type="button"
          className="btn-secondary mt-3 w-full"
          onClick={() => onChange([...items, { key: crypto.randomUUID(), value: '' }])}
        >
          {addLabel}
        </button>
      )}
    </fieldset>
  );
}
