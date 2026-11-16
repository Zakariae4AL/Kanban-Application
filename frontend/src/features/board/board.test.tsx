import { act, createEvent, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db } from '../../test/fakeApi';
import { renderApp } from '../../test/render';

const column = (name: RegExp) => screen.getByRole('region', { name });
const cardTitles = (region: HTMLElement) =>
  within(region)
    .queryAllByRole('listitem')
    .filter((li) => li.dataset.taskId)
    .map((li) => li.querySelector('button span')?.textContent);

async function openBoard() {
  const utils = renderApp('/boards');
  await screen.findByRole('heading', { level: 1, name: 'Platform Launch' });
  return utils;
}

describe('board', () => {
  it('shows the columns with their tasks and subtask progress', async () => {
    await openBoard();

    expect(column(/Todo \(2\)/)).toBeInTheDocument();
    expect(column(/Doing \(1\)/)).toBeInTheDocument();
    expect(column(/Done \(0\)/)).toBeInTheDocument();
    expect(cardTitles(column(/Todo/))).toEqual(['Build UI for onboarding flow', 'Build UI for search']);
    expect(screen.getByText('1 of 2 subtasks')).toBeInTheDocument();
  });

  it('switches boards from the sidebar and shows an empty board state', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('link', { name: 'Marketing Plan' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Marketing Plan' })).toBeInTheDocument();
    expect(screen.getByText(/This board is empty/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled();
  });

  it('redirects an unknown board id to the first board', async () => {
    renderApp('/boards/2f1c4a8e-9b0d-4c3e-8f5a-1b2c3d4e5f60');

    expect(await screen.findByRole('heading', { level: 1, name: 'Platform Launch' })).toBeInTheDocument();
  });

  it('opens a task, ticks a subtask and changes its status', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: /Build UI for onboarding flow/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Build UI for onboarding flow' });
    expect(within(dialog).getByText('Screens for the first visit.')).toBeInTheDocument();
    expect(within(dialog).getByText('Subtasks (1 of 2)')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Sign in page' }));
    expect(await within(dialog).findByText('Subtasks (2 of 2)')).toBeInTheDocument();
    await waitFor(() => expect(db.boards[0]!.columns[0]!.tasks[0]!.subtasks[1]!.isCompleted).toBe(true));

    await user.selectOptions(within(dialog).getByLabelText('Current Status'), 'Done');
    await waitFor(() => expect(cardTitles(column(/Done/))).toEqual(['Build UI for onboarding flow']));
    expect(db.calls).toContain(`PATCH /tasks/${db.boards[0]!.columns[2]!.tasks[0]!.id}/move`);
  });

  it('closes dialogs with Escape and gives focus back', async () => {
    const { user } = await openBoard();
    const card = screen.getByRole('button', { name: /Build UI for search/ });

    await user.click(card);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });

  it('adds a task with subtasks, after validating the form', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: 'Add task' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add New Task' });
    await user.click(within(dialog).getByRole('button', { name: 'Create Task' }));
    expect(within(dialog).getAllByText("Can't be empty")).toHaveLength(3); // title + 2 empty subtasks

    await user.type(within(dialog).getByLabelText('Title'), 'Write release notes');
    await user.type(within(dialog).getByLabelText('Subtasks 1'), 'Draft');
    await user.click(within(dialog).getByRole('button', { name: 'Remove subtask 2' }));
    await user.selectOptions(within(dialog).getByLabelText('Status'), 'Doing');
    await user.click(within(dialog).getByRole('button', { name: 'Create Task' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(cardTitles(column(/Doing/))).toEqual(['Design settings page', 'Write release notes']),
    );
    expect(screen.getByText('0 of 1 subtasks')).toBeInTheDocument();
  });

  it('edits and deletes a task', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: /Build UI for search/ }));
    await user.click(await screen.findByRole('button', { name: 'Task options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit Task' }));
    const form = await screen.findByRole('dialog', { name: 'Edit Task' });
    await user.clear(within(form).getByLabelText('Title'));
    await user.type(within(form).getByLabelText('Title'), 'Build search results');
    await user.click(within(form).getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('button', { name: /Build search results/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Build search results/ }));
    await user.click(await screen.findByRole('button', { name: 'Task options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete Task' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete this task?' });
    expect(confirm).toHaveTextContent("'Build search results'");
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: /Build search results/ })).not.toBeInTheDocument());
  });

  it('moves a card with drag and drop to the position under the pointer', async () => {
    await openBoard();
    const card = screen.getByRole('button', { name: /Build UI for search/ });
    const doing = column(/Doing/);

    // jsdom has no layout: give the existing Doing card a position.
    const existing = within(doing).getAllByRole('listitem').find((li) => li.dataset.taskId)!;
    existing.getBoundingClientRect = () => ({ top: 100, height: 80, bottom: 180 }) as DOMRect;

    act(() => {
      fireEvent.dragStart(card, { dataTransfer: { setData: () => {}, effectAllowed: '' } });
    });
    // jsdom drag events don't carry pointer coordinates, so set them by hand.
    const at = (event: Event, clientY: number) => {
      Object.defineProperty(event, 'clientY', { value: clientY });
      return event;
    };
    fireEvent(doing, at(createEvent.dragOver(doing, { dataTransfer: { dropEffect: '' } }), 110)); // above its middle
    fireEvent(doing, at(createEvent.drop(doing, { dataTransfer: { getData: () => '' } }), 110));

    await waitFor(() =>
      expect(cardTitles(column(/Doing/))).toEqual(['Build UI for search', 'Design settings page']),
    );
    await waitFor(() => expect(db.boards[0]!.columns[1]!.tasks.map((t) => t.title)).toEqual(['Build UI for search', 'Design settings page']));
  });

  it('creates a board and opens it', async () => {
    const { user } = await openBoard();

    await user.click(screen.getAllByRole('button', { name: '+ Create New Board' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: 'Add New Board' });
    await user.type(within(dialog).getByLabelText('Board Name'), 'Website Redesign');
    await user.click(within(dialog).getByRole('button', { name: '+ Add New Column' }));
    await user.type(within(dialog).getByLabelText('Board Columns 3'), 'todo');
    await user.click(within(dialog).getByRole('button', { name: 'Create New Board' }));
    expect(within(dialog).getByText('Already used')).toBeInTheDocument(); // "todo" vs "Todo"

    await user.clear(within(dialog).getByLabelText('Board Columns 3'));
    await user.type(within(dialog).getByLabelText('Board Columns 3'), 'Done');
    await user.click(within(dialog).getByRole('button', { name: 'Create New Board' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Website Redesign' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Website Redesign' })).toHaveAttribute('aria-current', 'page');
    expect(column(/Done \(0\)/)).toBeInTheDocument();
  });

  it('renames a board and adds a column', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: '+ New Column' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Board' });
    await user.clear(within(dialog).getByLabelText('Board Name'));
    await user.type(within(dialog).getByLabelText('Board Name'), 'Launch 2.0');
    await user.click(within(dialog).getByRole('button', { name: '+ Add New Column' }));
    await user.type(within(dialog).getByLabelText('Board Columns 4'), 'Review');
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Launch 2.0' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Launch 2.0' })).toBeInTheDocument();
    expect(column(/Review \(0\)/)).toBeInTheDocument();
    expect(cardTitles(column(/Todo/))).toHaveLength(2); // existing tasks kept
  });

  it('deletes a board after confirmation', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: 'Board options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete Board' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete this board?' });
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect(db.boards).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Board options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete Board' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Marketing Plan' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Platform Launch' })).not.toBeInTheDocument();
  });

  it('offers to create a board when there are none', async () => {
    db.boards = [];
    renderApp('/boards');

    expect(await screen.findByText(/You have no boards yet/)).toBeInTheDocument();
  });
});

describe('preferences', () => {
  it('switches to dark mode and remembers it', async () => {
    const { user } = await openBoard();

    await user.click(screen.getAllByRole('switch', { name: 'Dark mode' })[0]!);

    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('kanban.theme')).toBe('dark');
    expect(screen.getAllByRole('switch', { name: 'Dark mode' })[0]).toBeChecked();
  });

  it('switches the interface to French', async () => {
    const { user } = await openBoard();

    await user.click(screen.getAllByRole('button', { name: 'FR' })[0]!);

    expect(screen.getByRole('button', { name: 'Ajouter une tâche' })).toBeInTheDocument();
    expect(screen.getByText('1 sur 2 sous-tâches')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('hides and shows the sidebar', async () => {
    const { user } = await openBoard();

    await user.click(screen.getByRole('button', { name: 'Hide Sidebar' }));
    expect(screen.queryByRole('link', { name: 'Marketing Plan' })).not.toBeInTheDocument();
    expect(localStorage.getItem('kanban.sidebar')).toBe('closed');

    await user.click(screen.getByRole('button', { name: 'Show sidebar' }));
    expect(screen.getByRole('link', { name: 'Marketing Plan' })).toBeInTheDocument();
  });
});
