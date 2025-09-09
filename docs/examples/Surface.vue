<template>
  <div><slot></slot></div>
</template>

<style scoped>
  div {
    color: black;
    background-color: #f0f0f0;
    border-top: 2px solid grey;
    border-bottom: 2px solid grey;
    margin: 0 -24px;
    padding: 20px 12px;
    overflow-x: auto;
  }

  @media (min-width: 640px) {
    div {
      border: 2px solid grey;
      border-radius: 8px;
      margin: 0;
    }
  }
</style>