/* eslint-disable @typescript-eslint/no-explicit-any */
import { useComputationService, type ComputeFn } from "./useComputationService";
import { useEffectService, type UseEffect } from "./useEffectService";
import { createTaskQueue } from "./queue";
import { usePersistence, type PersistenceOptions } from "./persistence";

export type SetState<T> = (newState: T) => T;
export type ActionFn<T> = (state: T, setState: SetState<T>, ...args: any[]) => T | void;
export type StoreActions<T, U> = {
  [K in keyof U]: U[K] extends (state: T, setState: SetState<T>, ...args: infer Args) => T | void
    ? (...args: Args) => T | void
    : never;
};
interface PersistStateOptions {
  shouldQueue: boolean;
}

export interface CreateStoreOptions<T, U extends Record<string, ActionFn<T>> = Record<string, ActionFn<T>>> {
  actions?: U;
  persistence?: PersistenceOptions;
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

export function createStore<T, U extends Record<string, ActionFn<T>> = Record<string, ActionFn<T>>>(
  state: T, options?: CreateStoreOptions<T, U>
): TeenyStore<T, U> {
  let currentState = state;

  const taskQueue = createTaskQueue();
  let queueFlushedPromise = Promise.resolve();
  const queueTask = (key: PropertyKey, task: () => void) => {
    taskQueue.add(key, task);
  };
  const flushQueue = () => {
    if (taskQueue.size() > 0) {
      queueFlushedPromise = taskQueue.flush();
    }
  };

  const persistenceOptions = options?.persistence;
  const persistenceTaskKey = Symbol('persistence');
  const { getFromStorage, persist } = usePersistence();

  const persistState = ({ shouldQueue }: PersistStateOptions = { shouldQueue: false }) => {
    if (persistenceOptions) {
      if (shouldQueue) {
        queueTask(persistenceTaskKey, () => persist(currentState, persistenceOptions));
      } else {
        persist(currentState, persistenceOptions);
      }
    }
  };
  if (persistenceOptions) {
    const persistedState = getFromStorage(persistenceOptions);
    if (persistedState) {
      currentState = persistedState as T;
    } else {
      persistState();
    }
  }

  const { useEffect, triggerEffects } = useEffectService({ queue: taskQueue });
  const { computed, compute, triggerRecomputation } = useComputationService({ queue: taskQueue });

  const setState = (newState: T): T => {
    currentState = newState;

    persistState({ shouldQueue: true });
    triggerEffects();
    triggerRecomputation();
    flushQueue();

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