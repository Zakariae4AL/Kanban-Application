import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  useCreateBoardMutation,
  useCreateTaskMutation,
  useDeleteBoardMutation,
  useDeleteTaskMutation,
  useGetBoardQuery,
  useGetBoardsQuery,
  useLogoutMutation,
  useMoveTaskMutation,
  useToggleSubtaskMutation,
  useUpdateBoardMutation,
  useUpdateTaskMutation,
} from '../../api/api';
import { useI18n } from '../../i18n/I18nProvider';
import { storage } from '../../storage';
import { BoardView, EmptyState } from './BoardView';
import { Header } from './Header';
import type { ModalState } from './modalState';
import { BoardFormModal } from './modals/BoardFormModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { TaskDetailsModal } from './modals/TaskDetailsModal';
import { TaskFormModal } from './modals/TaskFormModal';
import { Sidebar } from './Sidebar';

const SIDEBAR_KEY = 'kanban.sidebar';

export function BoardLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { boardId } = useParams();
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [sidebarOpen, setSidebarOpen] = useState(() => storage.get(SIDEBAR_KEY) !== 'closed');

  const boards = useGetBoardsQuery();
  const knownBoard = Boolean(boardId && boards.data?.some((b) => b.id === boardId));
  const board = useGetBoardQuery(boardId ?? '', { skip: !knownBoard });

  const [createBoard] = useCreateBoardMutation();
  const [updateBoard] = useUpdateBoardMutation();
  const [deleteBoard] = useDeleteBoardMutation();
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [moveTask] = useMoveTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [toggleSubtask] = useToggleSubtaskMutation();
  const [logout] = useLogoutMutation();

  // Go to the first board when no (or an unknown) board is in the URL.
  if (boards.data && !knownBoard && boards.data[0]) {
    return <Navigate to={`/boards/${boards.data[0].id}`} replace />;
  }
  if (boards.data && boards.data.length === 0 && boardId) {
    return <Navigate to="/boards" replace />;
  }

  const current = knownBoard ? board.data : undefined;
  const close = () => setModal({ type: 'none' });
  const findTask = (taskId: string) => current?.columns.flatMap((c) => c.tasks).find((task) => task.id === taskId);

  const toggleSidebar = () =>
    setSidebarOpen((open) => {
      storage.set(SIDEBAR_KEY, open ? 'closed' : 'open');
      return !open;
    });

  const move = (taskId: string, columnId: string, position: number) => {
    if (current) void moveTask({ id: taskId, boardId: current.id, columnId, position });
  };

  const renderMain = () => {
    if (boards.isLoading || (knownBoard && board.isLoading)) {
      return <p className="grid h-full place-items-center text-muted">{t('common.loading')}</p>;
    }
    if (boards.isError || board.isError) {
      return (
        <EmptyState
          text={t('board.loadError')}
          action={t('board.retry')}
          onAction={() => {
            void boards.refetch();
            if (knownBoard) void board.refetch();
          }}
        />
      );
    }
    if (!current) {
      return (
        <EmptyState
          text={t('board.noBoards')}
          action={t('board.createBoard')}
          onAction={() => setModal({ type: 'addBoard' })}
        />
      );
    }
    return (
      <BoardView
        board={current}
        onOpenTask={(taskId) => setModal({ type: 'viewTask', taskId })}
        onMoveTask={move}
        onEditBoard={() => setModal({ type: 'editBoard' })}
      />
    );
  };

  const renderModal = () => {
    switch (modal.type) {
      case 'addBoard':
        return (
          <BoardFormModal
            onClose={close}
            onSubmit={async (input) => {
              const created = await createBoard(input).unwrap();
              navigate(`/boards/${created.id}`);
            }}
          />
        );
      case 'editBoard':
        return current ? (
          <BoardFormModal
            board={current}
            onClose={close}
            onSubmit={(input) => updateBoard({ id: current.id, ...input }).unwrap()}
          />
        ) : null;
      case 'deleteBoard':
        return current ? (
          <ConfirmDeleteModal
            title={t('delete.boardTitle')}
            text={t('delete.boardText', { name: current.name })}
            onClose={close}
            onConfirm={async () => {
              await deleteBoard(current.id).unwrap();
              navigate('/boards', { replace: true });
            }}
          />
        ) : null;
      case 'addTask':
        return current ? (
          <TaskFormModal
            columns={current.columns}
            onClose={close}
            onSubmit={(input) => createTask({ boardId: current.id, ...input }).unwrap()}
          />
        ) : null;
      case 'viewTask': {
        const task = findTask(modal.taskId);
        if (!task || !current) return null;
        return (
          <TaskDetailsModal
            task={task}
            columns={current.columns}
            onClose={close}
            onToggleSubtask={(id, isCompleted) => void toggleSubtask({ id, boardId: current.id, isCompleted })}
            onChangeStatus={(columnId) => move(task.id, columnId, Number.MAX_SAFE_INTEGER)}
            onEdit={() => setModal({ type: 'editTask', taskId: task.id })}
            onDelete={() => setModal({ type: 'deleteTask', taskId: task.id })}
          />
        );
      }
      case 'editTask': {
        const task = findTask(modal.taskId);
        if (!task || !current) return null;
        return (
          <TaskFormModal
            task={task}
            columns={current.columns}
            onClose={close}
            onSubmit={(input) => updateTask({ id: task.id, boardId: current.id, ...input }).unwrap()}
          />
        );
      }
      case 'deleteTask': {
        const task = findTask(modal.taskId);
        if (!task || !current) return null;
        return (
          <ConfirmDeleteModal
            title={t('delete.taskTitle')}
            text={t('delete.taskText', { name: task.title })}
            onClose={close}
            onConfirm={() => deleteTask({ id: task.id, boardId: current.id }).unwrap()}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar
        boards={boards.data ?? []}
        open={sidebarOpen}
        onToggle={toggleSidebar}
        onCreateBoard={() => setModal({ type: 'addBoard' })}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          boardName={current?.name}
          boards={boards.data ?? []}
          hasBoard={Boolean(current)}
          canAddTask={Boolean(current?.columns.length)}
          onAddTask={() => setModal({ type: 'addTask' })}
          onEditBoard={() => setModal({ type: 'editBoard' })}
          onDeleteBoard={() => setModal({ type: 'deleteBoard' })}
          onCreateBoard={() => setModal({ type: 'addBoard' })}
          onLogout={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        />
        <main className="flex-1 overflow-auto">{renderMain()}</main>
      </div>
      {renderModal()}
    </div>
  );
}
