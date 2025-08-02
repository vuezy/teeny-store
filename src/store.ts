/* eslint-disable @typescript-eslint/no-explicit-any */
import { createComputationService, type ComputeFn } from "./computationService";
import { createEffectService, type UseEffect } from "./effectService";
import { createTaskQueue } from "./queue";
import { usePersistence, type PersistenceOptions, type ValidStorage } from "./persistence";
import { createEffectProcessor } from "./effectProcessor";

/**
 * @template T - The type of the state.
 */
export type SetState<T> = (newState: T) => T;

/**
 * @template T - The type of the state.
 */
export type ActionFn<T> = (state: T, setState: SetState<T>, ...args: any[]) => T | void;

/**
 * @template T - The type of the state.
 * @template U - The type of the action collection.
 */
export type StoreActions<T, U> = {
  [K in keyof U]: U[K] extends (state: T, setState: SetState<T>, ...args: infer Args) => T | void
    ? (...args: Args) => T | void
    : never;
};

export interface ConfigurePersistenceOptions {
  /**
   * The type of persistent storage to use.
   */
  storage: ValidStorage;

  /**
   * The storage key.
   */
  key: string;

  /**
   * Whether to clear the previously used persistent storage.
   */
  clearPrev?: boolean;
};

/**
 * @param options - See {@link ConfigurePersistenceOptions}.
 */
export type ConfigurePersistence = (options: ConfigurePersistenceOptions) => void;

/**
 * @template T - The type of the state.
 * @template U - The type of the action collection.
 */
export interface CreateStoreOptions<T, U extends Record<string, ActionFn<T>> = Record<string, ActionFn<T>>> {
  /**
   * A collection of actions that update the state.
   */
  actions?: U;

  /**
   * See {@link PersistenceOptions}.
   */
  persistence?: PersistenceOptions;
};

/**
 * Represents a stupidly small and simple store for state and effect management.
 * @template T - The type of the state.
 * @template U - The type of the action collection.
 */
export interface TeenyStore<T, U> {
  /**
   * Get the state.
   * @returns The state.
   */
  getState: () => T;

  /**
   * The computed properties.
   */
  computed: Record<string, unknown>;

  /**
   * Update the state and trigger side effects.
   */
  setState: SetState<T>;

  /**
   * A collection of actions that can be used to update the state.
   */
  actions: StoreActions<T, U>;

  /**
   * Perform an effect in response to dependency changes.
   */
  useEffect: UseEffect;

  /**
   * Compute a value in response to dependency changes.
   */
  compute: ComputeFn;

  /**
   * Persist the state to a storage.
   */
  persist: ConfigurePersistence;

  /**
   * Load data from a persistent storage to update the state. This operation will also trigger side effects.
   * @param options - See {@link PersistenceOptions}.
   */
  loadFromPersistence: (options: PersistenceOptions) => void;

  /**
   * Turns off persistence and clears stored data (state).
   */
  dropPersistence: () => void;

  /**
   * Wait until all side effects have been processed.
   * @returns A promise that resolves when all side effects have been processed.
   */
  nextTick: () => Promise<void>;
};

/**
 * Create a {@link TeenyStore}.
 * @template T - The type of the state.
 * @template U - The type of the action collection.
 * @param state - The initial state.
 * @param options - See {@link CreateStoreOptions}.
 * @returns A {@link TeenyStore}.
 */
export function createStore<T, U extends Record<string, ActionFn<T>> = Record<string, ActionFn<T>>>(
  state: T, options?: CreateStoreOptions<T, U>
): TeenyStore<T, U> {
  let currentState = state;

  const queue = createTaskQueue();
  let queueFlushedPromise = Promise.resolve();
  const flushQueue = () => {
    if (queue.size() > 0) {
      queueFlushedPromise = queue.flush();
    }
  };

  const { setStorage, get: getFromStorage, persist, remove: dropPersistence } = usePersistence();
  const configurePersistence: ConfigurePersistence = ({ storage, key, clearPrev }) => {
    if (clearPrev) {
      dropPersistence();
    }
    setStorage({ storage, key });
    persist(currentState);
  };
  const loadFromPersistence = (options: PersistenceOptions) => {
    const persistedState = getFromStorage(options);
    if (persistedState !== undefined) {
      setState(persistedState as T);
    }
  };

  if (options?.persistence) {
    setStorage(options.persistence);

    const persistedState = getFromStorage();
    if (persistedState !== undefined) {
      currentState = persistedState as T;
    } else {
      persist(currentState);
    }
  }

  const effectProcessor = createEffectProcessor({ queue });
  effectProcessor.trackEffect(Symbol('persistence'), () => persist(currentState), undefined, {
    runner: (effectEntry) => effectEntry.effect(),
    immediate: false,
  });
  const { useEffect } = createEffectService(effectProcessor);
  const { computed, compute } = createComputationService(effectProcessor);

  const setState: SetState<T> = (newState) => {
    currentState = newState;

    effectProcessor.triggerEffects();
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

  return {
    getState: () => currentState,
    computed: computed,
    setState: setState,
    actions: buildActions(),
    useEffect: useEffect,
    compute: compute,
    persist: configurePersistence,
    loadFromPersistence: loadFromPersistence,
    dropPersistence: dropPersistence,
    nextTick: () => queueFlushedPromise,
  };
};