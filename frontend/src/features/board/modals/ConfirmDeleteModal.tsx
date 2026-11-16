import { useState } from 'react';
import { Modal } from '../../../components/Modal';
import { useI18n } from '../../../i18n/I18nProvider';

export function ConfirmDeleteModal({
  title,
  text,
  onConfirm,
  onClose,
}: {
  title: string;
  text: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <Modal title={title} onClose={onClose} tone="danger">
      <p className="mb-6 text-[13px] leading-6 text-muted">{text}</p>
      {error && (
        <p role="alert" className="mb-4 text-[13px] text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          className="btn-danger flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch {
              setError(t('error.generic'));
              setBusy(false);
            }
          }}
        >
          {t('delete.confirm')}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          {t('delete.cancel')}
        </button>
      </div>
    </Modal>
  );
}
