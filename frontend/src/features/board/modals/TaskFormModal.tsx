import { useState, type FormEvent } from 'react';
import type { Column, Task, TaskInput } from '../../../api/types';
import { TextAreaField, TextField } from '../../../components/Field';
import { Modal } from '../../../components/Modal';
import { StatusSelect } from '../../../components/StatusSelect';
import { useI18n } from '../../../i18n/I18nProvider';
import { ListEditor } from './ListEditor';
import { validateList, type ListItem } from './listValidation';

const MAX_SUBTASKS = 20;

type Props = {
  columns: Column[];
  task?: Task; // editing when present
  onSubmit: (input: TaskInput) => Promise<unknown>;
  onClose: () => void;
};

export function TaskFormModal({ columns, task, onSubmit, onClose }: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState(task?.title ?? '');
  const [titleError, setTitleError] = useState<string>();
  const [description, setDescription] = useState(task?.description ?? '');
  const [columnId, setColumnId] = useState(task?.columnId ?? columns[0]?.id ?? '');
  const [subtasks, setSubtasks] = useState<ListItem[]>(
    task
      ? task.subtasks.map((s) => ({ key: s.id, id: s.id, value: s.title }))
      : [
          { key: 'a', value: '' },
          { key: 'b', value: '' },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const titleOk = title.trim().length > 0;
    setTitleError(titleOk ? undefined : t('validation.required'));
    const checked = validateList(subtasks, { required: t('validation.required') });
    setSubtasks(checked.items);
    if (!titleOk || !checked.valid) return;

    setSaving(true);
    setFormError(undefined);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        columnId,
        subtasks: subtasks.map((s) => ({ ...(s.id && { id: s.id }), title: s.value.trim() })),
      });
      onClose();
    } catch {
      setFormError(t('error.generic'));
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? t('form.editTask') : t('form.addTask')} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-6">
        <TextField
          label={t('form.title')}
          placeholder={t('form.titlePlaceholder')}
          value={title}
          maxLength={100}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleError(undefined);
          }}
          error={titleError}
        />
        <TextAreaField
          label={t('form.description')}
          placeholder={t('form.descriptionPlaceholder')}
          value={description}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
        />
        <ListEditor
          label={t('form.subtasks')}
          items={subtasks}
          placeholder={t('form.subtaskPlaceholder')}
          addLabel={t('form.addSubtask')}
          removeLabel={(_item, index) => t('form.removeSubtask', { index: index + 1 })}
          max={MAX_SUBTASKS}
          maxLength={100}
          onChange={setSubtasks}
        />
        <StatusSelect label={t('form.status')} columns={columns} value={columnId} onChange={setColumnId} />
        {formError && (
          <p role="alert" className="text-[13px] text-danger">
            {formError}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t('form.saving') : task ? t('form.saveChanges') : t('form.createTask')}
        </button>
      </form>
    </Modal>
  );
}
