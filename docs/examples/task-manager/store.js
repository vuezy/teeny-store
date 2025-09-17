import { createStore } from "@vuezy/teeny-store";

export function createTaskManagerStore() {
  const store = createStore({ tasks: [], filter: 'all' }, {
    actions: {
      addTask: (state, setState, task) => {
        const tasks = [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            title: task.title,
            description: task.desc,
            done: false,
          },
        ];
        setState(() => ({ ...state, tasks }));
      },
      editTask: (state, setState, updatedTask) => {
        const tasks = state.tasks.map((task) => {
          return task.id === updatedTask.id
            ? { ...task, title: updatedTask.title, description: updatedTask.desc }
            : task;
        });
        setState(() => ({ ...state, tasks }));
      },
      toggleTaskDone: (state, setState, id) => {
        const tasks = state.tasks.map((task) => {
          return task.id === id ? { ...task, done: !task.done } : task;
        });
        setState(() => ({ ...state, tasks }));
      },
      deleteTask: (state, setState, id) => {
        const tasks = state.tasks.filter((task) => task.id !== id);
        setState(() => ({ ...state, tasks }));
      },
      clearAllTasks: (state, setState) => {
        setState(() => ({ ...state, tasks: [] }));
      },
      filterTasks: (state, setState, filter) => {
        setState(() => ({ ...state, filter }));
      },
    },
    persistence: {
      storage: 'localStorage',
      key: 'task-manager',
      onLoaded: (data) => {
        return { ...data, filter: 'all' };
      },
    },
  });

  return store;
};