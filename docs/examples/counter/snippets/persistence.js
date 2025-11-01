/* eslint-disable @typescript-eslint/no-unused-vars */
// #region persistence
import { createPersistencePlugin, defineStore } from "@vuezy/teeny-store";

const store = defineStore(0).use(createPersistencePlugin({
  storage: 'localStorage',
  key: 'counter',
})).create();
// #endregion persistence