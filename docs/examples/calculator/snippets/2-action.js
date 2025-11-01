import { createStore } from "@vuezy/teeny-store";

// #region action
const store = createStore({
  operand1: 0,
  operand2: 0,
  operator: '+',
  result: 0,
}, {
  setOperand1: (state, setState, operand) => {
    setState((state) => ({ ...state, operand1: operand }));
  },
  setOperand2: (state, setState, operand) => {
    setState((state) => ({ ...state, operand2: operand }));
  },
  setOperator: (state, setState, operator) => {
    setState((state) => ({ ...state, operator }));
  },
  calculate: (state, setState) => {
    let result = NaN;
    if (state.operator === '+') {
      result = parseFloat(state.operand1) + parseFloat(state.operand2);
    } else if (state.operator === '-') {
      result = parseFloat(state.operand1) - parseFloat(state.operand2);
    } else if (state.operator === 'x') {
      result = parseFloat(state.operand1) * parseFloat(state.operand2);
    } else if (state.operator === '/') {
      result = parseFloat(state.operand1) / parseFloat(state.operand2);
    }
    setState((state) => ({ ...state, result }));
  },
});
// #endregion action

// #region listener
function updateOperand1(event) {
  store.actions.setOperand1(event.target.value);
  store.actions.calculate();
}

function updateOperand2(event) {
  store.actions.setOperand2(event.target.value);
  store.actions.calculate();
}

function updateOperator(event) {
  store.actions.setOperator(event.target.textContent);
  store.actions.calculate();
}

document.getElementById('operand1')?.addEventListener('change', updateOperand1);
document.getElementById('operand2')?.addEventListener('change', updateOperand2);

const operatorBtns = document.getElementsByClassName('operator-btn');
for (let i = 0; i < operatorBtns.length; i++) {
  operatorBtns[i].addEventListener('click', updateOperator);
}
// #endregion listener