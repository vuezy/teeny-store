// #region createStore
import { createStore } from "@vuezy/teeny-store";

const store = createStore({
  operand1: 0,
  operand2: 0,
  operator: '+',
  result: 0,
});
// #endregion createStore

// #region setState
store.setState((state) => ({ ...state, operator: '-' }));
// #endregion setState