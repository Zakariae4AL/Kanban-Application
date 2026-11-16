import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Extra element next to the title (e.g. a menu). */
  titleAside?: ReactNode;
  tone?: 'default' | 'danger';
};

/**
 * Accessible dialog: labelled, closes on Escape or backdrop click,
 * keeps keyboard focus inside and gives it back when it closes.
 */
export function Modal({ title, onClose, children, titleAside, tone = 'default' }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const firstItem = items[0]!;
        const lastItem = items[items.length - 1]!;
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="my-auto w-full max-w-[480px] rounded-lg bg-white p-6 shadow-xl outline-none sm:p-8 dark:bg-surface-dark"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className={`text-lg font-bold ${tone === 'danger' ? 'text-danger' : 'text-ink dark:text-white'}`}
          >
            {title}
          </h2>
          {titleAside}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
