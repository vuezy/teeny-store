import { createTaskManagerStore } from "./store";

/* @docs-strip-export */
export function init() {
  const store = createTaskManagerStore();
  store.useEffect(renderTasks, (state) => [state.tasks, state.filter]); 

  function renderTasks(state) {
    const taskList = document.getElementById('task-list');
    if (taskList) {
      taskList.innerHTML = '';
      state.tasks.forEach((task) => {
        if (state.filter === 'done' && !task.done) return;
        if (state.filter === 'pending' && task.done) return;

        const li = document.createElement('li');
        li.className = 'task-item';

        const info = document.createElement('div');
        info.className = 'task-info' + (task.done ? ' done' : '');
        info.innerHTML = `<strong>${task.title}</strong><br>${task.description}`;

        const btnGroup = document.createElement('div');

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = task.done ? 'Undone' : 'Done';
        toggleBtn.addEventListener('click', () => toggleTaskDone(task.id));

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editTask(task.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        btnGroup.appendChild(toggleBtn);
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);

        li.appendChild(info);
        li.appendChild(btnGroup);
        taskList.appendChild(li);
      });
    }
  }

  function filterTasks(event) {
    store.actions.filterTasks(event.target.value);
  }

  function addTask() {
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');

    if (titleInput && descInput) {
      const newTitle = titleInput.value.trim();
      const newDesc = descInput.value.trim();

      if (newTitle && newDesc) {
        store.actions.addTask({ title: newTitle, desc: newDesc });
        titleInput.value = '';
        descInput.value = '';
      }
    }
  }

  function editTask(id) {
    const tasks = store.getState().tasks;
    const task = tasks.find((task) => task.id === id);
    if (!task) return;

    const newTitle = prompt('Edit title:', task.title);
    const newDesc = prompt('Edit description:', task.description);
    if (newTitle && newDesc) {
      store.actions.editTask({ id, title: newTitle.trim(), desc: newDesc.trim() });
    }
  }

  function toggleTaskDone(id) {
    store.actions.toggleTaskDone(id);
  }

  function deleteTask(id) {
    store.actions.deleteTask(id);
  }

  function clearAllTasks() {
    if (confirm('Are you sure you want to delete all tasks?')) {
      store.actions.clearAllTasks();
    }
  }

  document.getElementById('filter')?.addEventListener('change', filterTasks);
  document.getElementById('add-btn')?.addEventListener('click', addTask);
  document.getElementById('clear-btn')?.addEventListener('click', clearAllTasks);
};
/* @end-docs-strip-export */
