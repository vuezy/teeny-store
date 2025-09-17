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
    <strong class="section-label">Shop</strong>
    <div id="products"></div>
    
    <div class="cart-container">
      <strong class="section-label">
        Cart <span class="cart-item-count-container">- <span id="cart-item-count"></span> item(s)</span>
      </strong>
      <div id="cart"></div>
      <div class="cart-total-price-container">
        Total: $<span id="cart-total-price"></span>
      </div>
    </div>
  </Surface>
</template>

<style scoped>
  .section-label {
    display: block;
    font-size: 26px;
    margin-bottom: 0.5rem;
  }

  .cart-container {
    border-top: 1px solid black;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }

  .cart-item-count-container {
    font-size: 22px;
    font-weight: normal;
  }

  .cart-total-price-container {
    margin-top: 0.5rem;
    padding: 0 0.3rem;
    font-size: 22px;
    font-weight: 500;
    text-align: end;
  }
</style>