import { useEffectLogic } from "./effect";
import type { DefineEffects } from "./types";

export interface TeenyStore<T> {
  getState: () => T;
  setState: (newState: T) => T;
  trackEffects: (defineEffects: DefineEffects) => void;
  effectExecution: () => Promise<void>;
};

export function createStore<T>(state: T): TeenyStore<T> {
  let currentState = state;

  const { initiateEffects, runEffectSetup, getEffectExecutionPromise } = useEffectLogic();

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