import { createStore } from "@vuezy/teeny-store";

/* @docs-strip-export */
export function init() {
  const store = createStore({ operand1: 0, operand2: 0, operator: '+' }, {
    actions: {
      setOperand1: (state, setState, operand) => {
        setState((state) => ({ ...state, operand1: operand }));
      },
      setOperand2: (state, setState, operand) => {
        setState((state) => ({ ...state, operand2: operand }));
      },
      setOperator: (state, setState, operator) => {
        setState((state) => ({ ...state, operator }));
      },
    },
    persistence: {
      storage: 'localStorage',
      key: 'calculator',
    },
  });

  store.compute('result', (state) => {
    if (state.operator === '+') {
      return parseFloat(state.operand1) + parseFloat(state.operand2);
    }
    if (state.operator === '-') {
      return parseFloat(state.operand1) - parseFloat(state.operand2);
    }
    if (state.operator === 'x') {
      return parseFloat(state.operand1) * parseFloat(state.operand2);
    }
    if (state.operator === '/') {
      return parseFloat(state.operand1) / parseFloat(state.operand2);
    }
    return NaN;
  }, (state) => [state.operand1, state.operand2, state.operator]);

  store.useEffect((state) => renderOperand('operand1', state.operand1), (state) => [state.operand1]);
  store.useEffect((state) => renderOperand('operand2', state.operand2), (state) => [state.operand2]);
  store.useEffect(renderOperator, (state) => [state.operator]);
  store.useEffect(renderResult, () => [store.computed.result]);

  function renderOperand(id, value) {
    const operandInput = document.getElementById(id);
    if (operandInput) {
      operandInput.value = value;
    }
  }

  function renderOperator(state) {
    const operatorEl = document.getElementById('operator');
    if (operatorEl) {
      operatorEl.textContent = state.operator;
    }
  }

  function renderResult() {
    const resultEl = document.getElementById('result');
    if (resultEl) {
      resultEl.textContent = store.computed.result;
    }
  }

  function updateOperand1(event) {
    store.actions.setOperand1(event.target.value);
  }

  function updateOperand2(event) {
    store.actions.setOperand2(event.target.value);
  }

  function updateOperator(event) {
    store.actions.setOperator(event.target.textContent);
  }

  document.getElementById('operand1')?.addEventListener('change', updateOperand1);
  document.getElementById('operand2')?.addEventListener('change', updateOperand2);

  const operatorBtns = document.getElementsByClassName('operator-btn');
  for (let i = 0; i < operatorBtns.length; i++) {
    operatorBtns[i].addEventListener('click', updateOperator);
  }
};
/* @end-docs-strip-export */