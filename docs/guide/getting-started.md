<script setup>
import App from '@examples/counter/App.vue';
</script>

# Getting Started
Teeny Store is a handy tool that helps you manage application state and side-effects. You can easily use it in any modern JavaScript/TypeScript project.

## Installation
You can install Teeny Store via a package manager, or load it directly in the browser using a CDN.

### Package Manager
::: code-group
```sh [npm]
npm install @vuezy/teeny-store
```
```sh [pnpm]
pnpm add @vuezy/teeny-store
```
```sh [yarn]
yarn add @vuezy/teeny-store
```
```sh [bun]
bun add @vuezy/teeny-store
```
:::

### CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@vuezy/teeny-store"></script>
```

## Usage
<<< @/examples/counter/index.js
<App />

The code basically sets up a store to keep track of the `count` state.
Whenever the `count` state changes, the element displaying it is re-rendered.
The state is also persisted to the `localStorage`.
<br><br>
For more examples, see the [Examples](/guide/examples) page.  
Check out the [API Reference](/reference) for more details.