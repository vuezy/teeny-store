import { createStore } from "@vuezy/teeny-store";

/* @docs-strip-export */
export function init() {
  const store = createStore(0, {
    persistence: {
      storage: 'localStorage',
      key: 'counter',
    },
  });

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
/* @end-docs-strip-export */