import { createStore } from "@vuezy/teeny-store";

/* @docs-strip-export */
export function init() {
  const countEl = document.getElementById('count');
  const store = createStore(0, {
    persistence: {
      storage: 'localStorage',
      key: 'counter',
    },
  });

  store.useEffect(() => {
    renderCount();
  }, (state) => [state]);

  function renderCount() {
    countEl.textContent = store.getState();
  }

  document.getElementById('decrement-btn').addEventListener('click', () => {
    store.setState((state) => state - 1);
  });

  document.getElementById('increment-btn').addEventListener('click', () => {
    store.setState((state) => state + 1);
  });
};
/* @docs-strip-export */