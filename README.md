# Teeny Store
A stupidly small and simple store for state and effect management. You can easily use it in any modern JavaScript/TypeScript project. Read the [docs here](https://vuezy.github.io/teeny-store/).

## Installation
You can install Teeny Store via a package manager, or load it directly in the browser using a CDN.
```bash
npm install @vuezy/teeny-store
```
```html
<script src="https://cdn.jsdelivr.net/npm/@vuezy/teeny-store"></script>
```
When loaded via a CDN, the library is available globally as `window.TeenyStore`.

## Usage
```js
import { createStore } from "@vuezy/teeny-store";

export function init() {
  const store = createStore(0);
  store.useEffect(renderCount, (state) => [state]);

  function renderCount(count) {
    const countEl = document.getElementById('count');
    if (countEl) {
      countEl.textContent = count;
    }
  }

  function decrement() {
    store.setState((state) => state - 1);
  }

  function increment() {
    store.setState((state) => state + 1);
  }

  document.getElementById('decrement-btn')?.addEventListener('click', decrement);
  document.getElementById('increment-btn')?.addEventListener('click', increment);
};
```

## License
[MIT](https://github.com/vuezy/teeny-store/blob/main/LICENSE)  
Copyright (c) 2025-PRESENT Shane Christian Kwok