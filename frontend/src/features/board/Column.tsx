import { useRef, useState, type DragEvent } from 'react';
import type { Column as ColumnType } from '../../api/types';
import { useI18n } from '../../i18n/I18nProvider';
import { columnColor } from './columnColors';
import { TaskCard } from './TaskCard';

type Props = {
  column: ColumnType;
  index: number;
  draggingId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDrop: (taskId: string, columnId: string, position: number) => void;
  onOpenTask: (taskId: string) => void;
};

export function Column({ column, index, draggingId, onDragStart, onDragEnd, onDrop, onOpenTask }: Props) {
  const { t } = useI18n();
  const list = useRef<HTMLOListElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const others = column.tasks.filter((task) => task.id !== draggingId);

  /** Index among the other cards, based on where the pointer is. */
  const indexFromPointer = (clientY: number): number => {
    const cards = [...(list.current?.querySelectorAll<HTMLElement>('[data-task-id]') ?? [])].filter(
      (el) => el.dataset.taskId !== draggingId,
    );
    const after = cards.findIndex((el) => {
      const rect = el.getBoundingClientRect();
      return clientY < rect.top + rect.height / 2;
    });
    return after === -1 ? cards.length : after;
  };

  const handleDragOver = (event: DragEvent) => {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropIndex(indexFromPointer(event.clientY));
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const taskId = draggingId ?? event.dataTransfer.getData('text/plain');
    const position = indexFromPointer(event.clientY);
    setDropIndex(null);
    if (!taskId) return;

    const current = column.tasks.findIndex((task) => task.id === taskId);
    if (current !== -1 && current === position) return; // dropped where it already was
    onDrop(taskId, column.id, position);
  };

  return (
    <section
      aria-labelledby={`column-${column.id}`}
      onDragOver={handleDragOver}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropIndex(null)}
      onDrop={handleDrop}
      className="flex w-[280px] shrink-0 flex-col"
    >
      <h2
        id={`column-${column.id}`}
        className="mb-6 flex items-center gap-3 text-xs font-bold tracking-[0.2em] text-muted uppercase"
      >
        <span aria-hidden="true" className="h-[15px] w-[15px] rounded-full" style={{ background: columnColor(index) }} />
        {t('board.columnLabel', { name: column.name, count: column.tasks.length })}
      </h2>

      <ol
        ref={list}
        className={`flex min-h-24 flex-1 flex-col gap-5 rounded-lg pb-6 transition-colors ${
          dropIndex !== null ? 'bg-accent/5 outline-2 outline-dashed outline-accent-text/40' : ''
        }`}
      >
        {column.tasks.map((task) => {
          const indicatorHere = dropIndex !== null && others[dropIndex]?.id === task.id;
          return (
            <DropSlot key={task.id} show={indicatorHere}>
              <TaskCard
                task={task}
                onOpen={onOpenTask}
                onDragStart={onDragStart}
                onDragEnd={() => {
                  setDropIndex(null);
                  onDragEnd();
                }}
                isDragging={draggingId === task.id}
              />
            </DropSlot>
          );
        })}
        {dropIndex !== null && dropIndex >= others.length && <DropIndicator label={t('board.dropHint')} />}
      </ol>
    </section>
  );
}

function DropSlot({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <>
      {show && <DropIndicator />}
      {children}
    </>
  );
}

function DropIndicator({ label }: { label?: string }) {
  return (
    <li aria-hidden="true" className="h-1 rounded-full bg-accent-text">
      {label && <span className="sr-only">{label}</span>}
    </li>
  );
}
