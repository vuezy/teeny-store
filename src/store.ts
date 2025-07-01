/* eslint-disable @typescript-eslint/no-explicit-any */
import { useComputedLogic } from "./computed";
import { useEffectLogic } from "./effect";
import { createEffectQueue } from "./queue";
import type { ComputeFn, UseEffect } from "./types";

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
  useEffect: UseEffect;
  compute: ComputeFn;
  computed: Record<string, unknown>;
  nextTick: () => Promise<void>;
};

export function createStore<T, U extends Record<string, ActionFn<T>>>(state: T, options?: CreateStoreOptions<T, U>): TeenyStore<T, U> {
  let currentState = state;

  const effectQueue = createEffectQueue();
  let queueFlushedPromise = Promise.resolve();

  const { useEffect, triggerEffects } = useEffectLogic({ effectQueue: effectQueue });
  const { computedProperties, compute, triggerRecomputation } = useComputedLogic({ effectQueue: effectQueue });

  const setState = (newState: T): T => {
    currentState = newState;
    triggerEffects();
    triggerRecomputation();
    queueFlushedPromise = effectQueue.flush();
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
    useEffect: useEffect,
    compute: compute,
    computed: computedProperties,
    nextTick: () => queueFlushedPromise,
  };

  return store;
};