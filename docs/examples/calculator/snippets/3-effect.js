import { createStore } from "@vuezy/teeny-store";

const store = createStore({
  operand1: 0,
  operand2: 0,
  operator: '+',
  result: 0,
});

// #region useEffect
store.useEffect((state) => renderOperand('operand1', state.operand1), (state) => [state.operand1]);
store.useEffect((state) => renderOperand('operand2', state.operand2), (state) => [state.operand2]);
store.useEffect(renderOperator, (state) => [state.operator]);
store.useEffect(store.actions.calculate, (state) => [state.operand1, state.operand2, state.operator]);
store.useEffect(renderResult, (state) => [state.result]);

function renderOperand(id, value) {
  const operandInput = document.getElementById(id);
  if (operandInput) {
    operandInput.value = value;
  }
}

function renderOperator() {
  const operatorEl = document.getElementById('operator');
  if (operatorEl) {
    operatorEl.textContent = store.getState().operator;
  }
}

function renderResult() {
  const resultEl = document.getElementById('result');
  if (resultEl) {
    resultEl.textContent = store.getState().result;
  }
}
// #endregion useEffect