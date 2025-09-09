/* eslint-disable @typescript-eslint/no-unused-vars */
import { createStore } from "@vuezy/teeny-store";

// #region persistence
const store = createStore({ operand1: 0, operand2: 0, operator: '+' }, {
  actions: {
    // ...
  },
  persistence: {
    storage: 'localStorage',
    key: 'calculator',
  },
});
// #endregion persistence