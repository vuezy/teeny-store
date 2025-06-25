import { useEffectLogic } from "./effect";
import type { DefineEffects } from "./types";

export interface CreateStoreOptions {
  dynamicEffects?: boolean;
};

export interface TeenyStore<T> {
  getState: () => T;
  setState: (newState: T) => T;
  trackEffects: (defineEffects: DefineEffects) => void;
  effectExecution: () => Promise<void>;
};

export function createStore<T>(state: T, options?: CreateStoreOptions): TeenyStore<T> {
  let currentState = state;

  const { initiateEffects, runEffectSetup, getEffectExecutionPromise } = useEffectLogic({ dynamic: options?.dynamicEffects });

  const store: TeenyStore<T> = {
    getState: () => currentState,
    
    setState: (newState: T): T => {
      currentState = newState;
      runEffectSetup();
      return currentState;
    },

    trackEffects: (defineEffects: DefineEffects) => {
      initiateEffects(defineEffects);
    },

    effectExecution: () => getEffectExecutionPromise(),
  };

  return store;
};