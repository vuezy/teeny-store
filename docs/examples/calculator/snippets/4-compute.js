/* eslint-disable @typescript-eslint/no-unused-vars */
import { createStore } from "@vuezy/teeny-store";

// #region compute
const store = createStore({
  operand1: 0,
  operand2: 0,
  operator: '+',
  result: 0, // [!code --]
}, {
  // ...
  calculate: (state, setState) => { // [!code --]
    // ... // [!code --]
  }, // [!code --]
});

store.compute('result', (state) => { // [!code ++]
  if (state.operator === '+') { // [!code ++]
    return parseFloat(state.operand1) + parseFloat(state.operand2); // [!code ++]
  } // [!code ++]
  if (state.operator === '-') { // [!code ++]
    return parseFloat(state.operand1) - parseFloat(state.operand2); // [!code ++]
  } // [!code ++]
  if (state.operator === 'x') { // [!code ++]
    return parseFloat(state.operand1) * parseFloat(state.operand2); // [!code ++]
  } // [!code ++]
  if (state.operator === '/') { // [!code ++]
    return parseFloat(state.operand1) / parseFloat(state.operand2); // [!code ++]
  } // [!code ++]
  return NaN; // [!code ++]
}, (state) => [state.operand1, state.operand2, state.operator]); // [!code ++]

// ...

store.useEffect(store.actions.calculate, (state) => [state.operand1, state.operand2, state.operator]); // [!code --]
store.useEffect(renderResult, (state) => [state.result]); // [!code --]
store.useEffect(renderResult, () => [store.computed.result]); // [!code ++]

// ...

function renderResult(state) {
  const resultEl = document.getElementById('result');
  if (resultEl) {
    resultEl.textContent = state.result; // [!code --]
    resultEl.textContent = store.computed.result; // [!code ++]
  }
}
// #endregion compute