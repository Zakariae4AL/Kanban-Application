import { useState } from 'react';
import type { Board } from '../../api/types';
import { useI18n } from '../../i18n/I18nProvider';
import { Column } from './Column';

type Props = {
  board: Board;
  onOpenTask: (taskId: string) => void;
  onMoveTask: (taskId: string, columnId: string, position: number) => void;
  onEditBoard: () => void;
};

export function BoardView({ board, onOpenTask, onMoveTask, onEditBoard }: Props) {
  const { t } = useI18n();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (board.columns.length === 0) {
    return (
      <EmptyState text={t('board.emptyColumns')} action={t('board.addColumn')} onAction={onEditBoard} />
    );
  }

  return (
    <div className="flex min-h-full gap-6 p-4 md:p-6">
      {board.columns.map((column, index) => (
        <Column
          key={column.id}
          column={column}
          index={index}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragEnd={() => setDraggingId(null)}
          onDrop={(taskId, columnId, position) => {
            setDraggingId(null);
            onMoveTask(taskId, columnId, position);
          }}
          onOpenTask={onOpenTask}
        />
      ))}
      {board.columns.length < 10 && (
        <button
          type="button"
          onClick={onEditBoard}
          className="mt-10 min-h-[200px] w-[280px] shrink-0 rounded-md bg-gradient-to-b from-[#e9effa] to-[#e9effa]/50 text-2xl font-bold text-muted hover:text-accent-text dark:from-surface-dark/60 dark:to-surface-dark/20"
        >
          {t('board.newColumn')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="max-w-md text-lg font-bold text-muted">{text}</p>
      <button type="button" className="btn-primary px-6 py-3.5 text-[15px]" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
