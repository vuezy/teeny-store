<script setup>
import { onMounted } from 'vue';
import Surface from '../Surface.vue';
import { init } from '.';
import './style.css';

onMounted(() => {
  init();
});
</script>

<template>
  <Surface>
    <div class="container">
      <div class="form">
        <input type="text" id="title" placeholder="Task title" />
        <input type="text" id="description" placeholder="Description" />
        <button id="add-btn">Add Task</button>
      </div>

      <div class="actions">
        <button id="clear-btn">Clear All</button>
        <select id="filter">
          <option value="all">All</option>
          <option value="done">Done</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <ul id="task-list"></ul>
    </div>
  </Surface>
</template>

<style scoped>
  .container {
    width: fit-content;
    margin: 0 auto;
  }

  .form, .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form input {
    flex: 1;
    border: 1px solid #808080;
    border-radius: 5px;
    padding: 0.5rem;
  }

  .form button {
    white-space: nowrap;
  }

  .actions select {
    background-color: transparent;
    border: 1px solid #808080;
    border-radius: 5px;
    padding: 0.5rem;
    appearance: auto;
  }

  button {
    background-color: white;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 0.25rem 0.5rem;
  }

  #task-list {
    list-style: none;
    padding: 0;
  }
</style>