import { useState, type FormEvent } from 'react';
import type { Board, BoardInput } from '../../../api/types';
import { TextField } from '../../../components/Field';
import { Modal } from '../../../components/Modal';
import { useI18n } from '../../../i18n/I18nProvider';
import { ListEditor } from './ListEditor';
import { validateList, type ListItem } from './listValidation';

const MAX_COLUMNS = 10;

type Props = {
  board?: Board; // editing when present
  onSubmit: (input: BoardInput) => Promise<unknown>;
  onClose: () => void;
};

export function BoardFormModal({ board, onSubmit, onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(board?.name ?? '');
  const [nameError, setNameError] = useState<string>();
  const [columns, setColumns] = useState<ListItem[]>(
    board
      ? board.columns.map((c) => ({ key: c.id, id: c.id, value: c.name }))
      : [
          { key: 'todo', value: 'Todo' },
          { key: 'doing', value: 'Doing' },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nameOk = name.trim().length > 0;
    setNameError(nameOk ? undefined : t('validation.required'));
    const checked = validateList(columns, {
      required: t('validation.required'),
      duplicate: t('validation.duplicate'),
    });
    setColumns(checked.items);
    if (!nameOk || !checked.valid) return;

    setSaving(true);
    setFormError(undefined);
    try {
      await onSubmit({
        name: name.trim(),
        columns: columns.map((c) => ({ ...(c.id && { id: c.id }), name: c.value.trim() })),
      });
      onClose();
    } catch {
      setFormError(t('error.generic'));
      setSaving(false);
    }
  };

  return (
    <Modal title={board ? t('form.editBoard') : t('form.addBoard')} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-6">
        <TextField
          label={t('form.boardName')}
          placeholder={t('form.boardNamePlaceholder')}
          value={name}
          maxLength={50}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(undefined);
          }}
          error={nameError}
        />
        <ListEditor
          label={t('form.columns')}
          items={columns}
          addLabel={t('form.addColumn')}
          removeLabel={(item) => t('form.removeColumn', { name: item.value || '…' })}
          max={MAX_COLUMNS}
          maxLength={30}
          onChange={setColumns}
        />
        {formError && (
          <p role="alert" className="text-[13px] text-danger">
            {formError}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t('form.saving') : board ? t('form.saveChanges') : t('form.createBoard')}
        </button>
      </form>
    </Modal>
  );
}
