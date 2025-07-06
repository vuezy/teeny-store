/* eslint-disable @typescript-eslint/no-explicit-any */
import { useComputedSystem, type ComputeFn } from "./computed";
import { useEffectSystem, type UseEffect } from "./effect";
import { createTaskQueue } from "./queue";

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
  computed: Record<string, unknown>;
  setState: SetState<T>;
  actions: StoreActions<T, U>;
  useEffect: UseEffect;
  compute: ComputeFn;
  nextTick: () => Promise<void>;
};

export function createStore<T, U extends Record<string, ActionFn<T>>>(state: T, options?: CreateStoreOptions<T, U>): TeenyStore<T, U> {
  let currentState = state;

  const taskQueue = createTaskQueue();
  let queueFlushedPromise = Promise.resolve();

  const { useEffect, triggerEffects } = useEffectSystem({ queue: taskQueue });
  const { computed, compute, triggerRecomputation } = useComputedSystem({ queue: taskQueue });

  const setState = (newState: T): T => {
    currentState = newState;
    triggerEffects();
    triggerRecomputation();
    
    if (taskQueue.size() > 0) {
      queueFlushedPromise = taskQueue.flush();
    }
    return currentState;
  };

  const buildActions = (): StoreActions<T, U> => {
    const actions: any = {};
    if (options?.actions) {
      for (const actionName in options.actions) {
        actions[actionName] = (...args: any[]) => options.actions?.[actionName](state, setState, ...args);
      }
    }
    return actions;
  };

  const store: TeenyStore<T, U> = {
    getState: () => currentState,
    computed: computed,
    setState: setState,
    actions: buildActions(),
    useEffect: useEffect,
    compute: compute,
    nextTick: () => queueFlushedPromise,
  };

  return store;
};