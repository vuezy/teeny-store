<script setup>
import { onMounted } from 'vue';
import Surface from '../Surface.vue';
import { init } from '.';

onMounted(() => {
  init();
});
</script>

<template>
  <Surface>
    <div class="container">
      <div class="wrapper">
        <input id="operand1" type="number">
        <span id="operator"></span>
        <input id="operand2" type="number">
        <span>=</span>
        <span id="result"></span>
      </div>
      <button type="button" class="operator-btn">+</button>
      <button type="button" class="operator-btn">-</button>
      <button type="button" class="operator-btn">x</button>
      <button type="button" class="operator-btn">/</button>
    </div>
  </Surface>
</template>

<style scoped>
  .container {
    width: fit-content;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
  }

  .wrapper {
    flex: 1 0 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 30px;
  }

  input {
    min-width: 120px;
    width: 25%;
    border: 1px solid #808080;
    border-radius: 5px;
    padding: 5px 0.5rem;
    font-size: 30px;
  }
  
  button {
    background-color: white;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 0.2rem 0.6rem;
    font-size: 22px;
  }
</style>