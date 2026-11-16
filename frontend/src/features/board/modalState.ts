/** Which dialog is open on the board screen. */
export type ModalState =
  | { type: 'none' }
  | { type: 'addBoard' }
  | { type: 'editBoard' }
  | { type: 'deleteBoard' }
  | { type: 'addTask' }
  | { type: 'viewTask'; taskId: string }
  | { type: 'editTask'; taskId: string }
  | { type: 'deleteTask'; taskId: string };
