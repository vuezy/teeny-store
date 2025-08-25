import { createStore } from "@vuezy/teeny-store";

const countEl = document.getElementById('count');
const store = createStore(0, {
  persistence: {
    storage: 'localStorage',
    key: 'counter',
  },
});

store.useEffect(() => {
  renderCount();
}, () => [store.getState()]);

function renderCount() {
  countEl.textContent = store.getState();
}

document.getElementById('decrement-btn').addEventListener('click', () => {
  store.setState(store.getState() - 1);
});

document.getElementById('increment-btn').addEventListener('click', () => {
  store.setState(store.getState() + 1);
});