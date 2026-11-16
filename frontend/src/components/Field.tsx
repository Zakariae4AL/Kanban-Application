import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

type FieldProps = {
  label: ReactNode;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, className = '', ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`input ${error ? 'input-error pr-36' : ''}`}
          {...input}
        />
        {error && (
          <span id={`${id}-error`} className="absolute top-1/2 right-4 -translate-y-1/2 text-[13px] text-danger">
            {error}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({ label, ...textarea }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea id={id} rows={4} className="input resize-none" {...textarea} />
    </div>
  );
}
