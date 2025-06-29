/* eslint-disable @typescript-eslint/no-explicit-any */
import { useComputedLogic } from "./computed";
import { useEffectLogic } from "./effect";
import type { ComputeFn, DefineEffects } from "./types";

export type SetState<T> = (newState: T) => T;
export type ActionFn<T> = (state: T, setState: SetState<T>, ...args: any[]) => T | void;
export type StoreActions<T, U> = {
  [K in keyof U]: U[K] extends (state: T, setState: SetState<T>, ...args: infer Args) => T | void
    ? (...args: Args) => T | void
    : never;
};

export interface CreateStoreOptions<T, U extends Record<string, ActionFn<T>>> {
  actions?: U;
  dynamicEffects?: boolean;
};

export interface TeenyStore<T, U> {
  getState: () => T;
  setState: SetState<T>;
  actions?: StoreActions<T, U>;

  trackEffects: (defineEffects: DefineEffects) => void;
  effectExecution: () => Promise<void>;

  compute: ComputeFn;
  computed: Record<string, unknown>;
  computation: () => Promise<void>;
};

export function createStore<T, U extends Record<string, ActionFn<T>>>(state: T, options?: CreateStoreOptions<T, U>): TeenyStore<T, U> {
  let currentState = state;

  const { computedProperties, compute, recompute, getComputationPromise } = useComputedLogic();
  const { initiateEffects, runEffectSetup, getEffectExecutionPromise } = useEffectLogic({ dynamic: options?.dynamicEffects });

  const setState = (newState: T): T => {
    currentState = newState;
    recompute();
    runEffectSetup();
    return currentState;
  };

  const extractActions = (): StoreActions<T, U> | undefined => {
    if (options?.actions) {
      const actions: any = {};
      for (const actionName in options.actions) {
        actions[actionName] = (...args: any[]) => options.actions?.[actionName](state, setState, ...args);
      }
      return actions;
    } else {
      return undefined;
    }
  };

  const store: TeenyStore<T, U> = {
    getState: () => currentState,
    setState: setState,
    actions: extractActions(),

    trackEffects: (defineEffects: DefineEffects) => {
      initiateEffects(defineEffects);
    },
    effectExecution: () => getEffectExecutionPromise(),

    compute: compute,
    computed: computedProperties,
    computation: () => getComputationPromise(),
  };

  return store;
};