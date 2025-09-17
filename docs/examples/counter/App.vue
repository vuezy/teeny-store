<script setup>
import { onMounted } from 'vue';
import Surface from '../Surface.vue';
import { init } from '.';

onMounted(() => {
  init();
});
</script>

<template>
  <Surface class="container">
    <button type="button" id="decrement-btn">-</button>
    <span id="count"></span>
    <button type="button" id="increment-btn">+</button>
  </Surface>
</template>

<style scoped>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    padding: 20px 12px;
  }
  
  button {
    background-color: white;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 0.25rem 0.5rem;
    font-size: 24px;
  }

  #count {
    font-size: 32px;
  }
</style>