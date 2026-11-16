/** Content of the board every new account starts with, in the user's language. */
export const STARTER_BOARD = {
  en: {
    name: 'My first board',
    columns: [
      {
        name: 'Todo',
        tasks: [
          {
            title: 'Explore your new Kanban board',
            description: 'Drag this card to another column, or open it to change its status.',
            subtasks: ['Open this task', 'Tick a subtask', 'Move it to "Doing"'],
          },
          { title: 'Create your own board', description: '', subtasks: [] },
        ],
      },
      { name: 'Doing', tasks: [] },
      {
        name: 'Done',
        tasks: [{ title: 'Sign up', description: '', subtasks: ['Choose a strong password'] }],
      },
    ],
  },
  fr: {
    name: 'Mon premier tableau',
    columns: [
      {
        name: 'À faire',
        tasks: [
          {
            title: 'Découvrir votre tableau Kanban',
            description:
              'Faites glisser cette carte vers une autre colonne, ou ouvrez-la pour changer son statut.',
            subtasks: [
              'Ouvrir cette tâche',
              'Cocher une sous-tâche',
              'La déplacer dans « En cours »',
            ],
          },
          { title: 'Créer votre propre tableau', description: '', subtasks: [] },
        ],
      },
      { name: 'En cours', tasks: [] },
      {
        name: 'Terminé',
        tasks: [
          {
            title: 'Créer un compte',
            description: '',
            subtasks: ['Choisir un mot de passe solide'],
          },
        ],
      },
    ],
  },
} as const;

export type StarterLocale = keyof typeof STARTER_BOARD;
