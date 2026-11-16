import { useEffect, useId, useRef, useState } from 'react';
import { EllipsisIcon } from './icons';

type MenuItem = { label: string; onSelect: () => void; danger?: boolean };

/** The "⋮" button with a small popup menu. Closes on outside click and Escape. */
export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-6 place-items-center rounded text-muted hover:text-ink dark:hover:text-white"
      >
        <EllipsisIcon />
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-3 w-48 space-y-4 rounded-lg bg-white p-4 shadow-[0_10px_20px_rgba(54,78,126,0.25)] dark:bg-page-dark"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`w-full text-left text-sm font-medium hover:underline ${
                  item.danger ? 'text-danger' : 'text-muted'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
