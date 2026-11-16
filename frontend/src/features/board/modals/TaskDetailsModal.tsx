import type { Column, Task } from '../../../api/types';
import { Menu } from '../../../components/Menu';
import { Modal } from '../../../components/Modal';
import { StatusSelect } from '../../../components/StatusSelect';
import { CheckIcon } from '../../../components/icons';
import { useI18n } from '../../../i18n/I18nProvider';

type Props = {
  task: Task;
  columns: Column[];
  onToggleSubtask: (subtaskId: string, isCompleted: boolean) => void;
  onChangeStatus: (columnId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function TaskDetailsModal({ task, columns, onToggleSubtask, onChangeStatus, onEdit, onDelete, onClose }: Props) {
  const { t } = useI18n();
  const done = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <Modal
      title={task.title}
      onClose={onClose}
      titleAside={
        <Menu
          label={t('task.menu')}
          items={[
            { label: t('task.edit'), onSelect: onEdit },
            { label: t('task.delete'), onSelect: onDelete, danger: true },
          ]}
        />
      }
    >
      <p className="mb-6 text-[13px] leading-6 whitespace-pre-line text-muted">
        {task.description || t('task.noDescription')}
      </p>

      {task.subtasks.length > 0 && (
        <fieldset className="mb-6">
          <legend className="field-label">{t('task.subtasksHeading', { done, total: task.subtasks.length })}</legend>
          <ul className="space-y-2">
            {task.subtasks.map((subtask) => (
              <li key={subtask.id}>
                <label className="flex cursor-pointer items-center gap-4 rounded bg-page p-3 hover:bg-accent/15 dark:bg-page-dark dark:hover:bg-accent/25">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={subtask.isCompleted}
                    onChange={(e) => onToggleSubtask(subtask.id, e.target.checked)}
                  />
                  <span
                    aria-hidden="true"
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-sm border border-muted/40 bg-white text-white peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-text dark:bg-surface-dark"
                  >
                    {subtask.isCompleted && <CheckIcon />}
                  </span>
                  <span
                    className={`text-xs font-bold ${subtask.isCompleted ? 'text-muted line-through' : ''}`}
                  >
                    {subtask.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <StatusSelect label={t('task.status')} columns={columns} value={task.columnId} onChange={onChangeStatus} />
    </Modal>
  );
}
