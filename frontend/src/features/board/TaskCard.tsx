import type { Task } from '../../api/types';
import { useI18n } from '../../i18n/I18nProvider';

type Props = {
  task: Task;
  onOpen: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
};

export function TaskCard({ task, onOpen, onDragStart, onDragEnd, isDragging }: Props) {
  const { t } = useI18n();
  const done = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <li data-task-id={task.id}>
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', task.id);
          onDragStart(task.id);
        }}
        onDragEnd={onDragEnd}
        onClick={() => onOpen(task.id)}
        className={`group w-full cursor-pointer rounded-lg bg-white px-4 py-6 text-left shadow-[0_4px_6px_rgba(54,78,126,0.1)] transition-opacity dark:bg-surface-dark ${
          isDragging ? 'opacity-40' : ''
        }`}
      >
        <span className="block text-[15px] font-bold group-hover:text-accent-text">{task.title}</span>
        {task.subtasks.length > 0 && (
          <span className="mt-2 block text-xs font-bold text-muted">
            {t('task.subtasksDone', { done, total: task.subtasks.length })}
          </span>
        )}
      </button>
    </li>
  );
}
