/* eslint-disable @typescript-eslint/no-explicit-any */
import { createComputationService, type ComputedDeps, type ComputeOptions, type ComputeReturn } from "./computationService";
import { createEffectService, type UseEffectOptions } from "./effectService";
import { createTaskQueue } from "./queue";
import { usePersistence, type ValidStorage } from "./persistence";
import { createEffectProcessor, type ToggleEffectActive } from "./effectProcessor";

/**
 * @template T - The type of the state.
 */
export type SetState<T> = (newState: (state: T) => T) => T;

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

/**
 * @template T - The type of the state.
 * @param effect - A function that performs an effect. It receives the current state as the argument.
 * @param depsFn - A function that re-evaluates the effect's dependencies. It receives the current state as the argument.
 * @param options - See {@link UseEffectOptions}.
 * @returns A function to toggle the active state of the effect.
 */
export type UseEffectWithState<T> = (effect: (state: T) => unknown, depsFn?: (state: T) => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

/**
 * @template T - The type of the state.
 * @param name - A unique name for the computed property.
 * @param computation - A function that performs a computation. It receives the current state as the argument.
 * @param depsFn - A function that re-evaluates the computation's dependencies. It receives the current state as the argument.
 * @param options - See {@link ComputeOptions}.
 * @returns See {@link ComputeReturn}.
 */
export type ComputeWithState<T> = (name: string, computation: (state: T) => unknown, depsFn: (state: T) => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

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

export interface StorePersistenceOptions<T> {
  /**
   * The type of persistent storage to use.
   */
  storage: ValidStorage;

  /**
   * The storage key.
   */
  key: string;

  /**
   * The function to be run after data is loaded from the storage and before it is used to update the state.
   * @param data - The data retrieved from the storage.
   * @returns The new state.
   */
  onLoaded?: (data: T) => T;
};

/**
 * @template T - The type of the state.
 * @template U - The type of the action collection.
 */
export interface CreateStoreOptions<T, U extends Record<string, ActionFn<T>>> {
  /**
   * A collection of actions that update the state.
   */
  actions?: U;

  /**
   * See {@link StorePersistenceOptions}.
   */
  persistence?: StorePersistenceOptions<T>;
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
  useEffect: UseEffectWithState<T>;

  /**
   * Compute a value in response to dependency changes.
   */
  compute: ComputeWithState<T>;

  /**
   * Persist the state to a storage.
   */
  persist: ConfigurePersistence;

  /**
   * Load data from a persistent storage to update the state. This operation will also trigger side effects.
   * @param options - See {@link StorePersistenceOptions}.
   */
  loadFromPersistence: (options: StorePersistenceOptions<T>) => void;

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
  state: T,
  options?: CreateStoreOptions<T, U>,
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
  const loadFromPersistence = (options: StorePersistenceOptions<T>) => {
    const persistedState = getFromStorage({ storage: options.storage, key: options.key });
    if (persistedState !== undefined) {
      setState(() => options.onLoaded?.(persistedState as T) ?? persistedState as T);
    }
  };

  if (options?.persistence) {
    setStorage({ storage: options.persistence.storage, key: options.persistence.key });

    const persistedState = getFromStorage();
    if (persistedState !== undefined) {
      if (options.persistence.onLoaded) {
        currentState = options.persistence.onLoaded?.(persistedState as T);
        persist(currentState);
      } else {
        currentState = persistedState as T;
      }
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

  const useEffectWithState: UseEffectWithState<T> = (effect, depsFn, options) => {
    return useEffect(() => effect(currentState), depsFn ? () => depsFn(currentState) : undefined, options);
  };

  const computeWithState: ComputeWithState<T> = (name, computation, depsFn, options) => {
    return compute(name, () => computation(currentState), () => depsFn(currentState), options);
  };

  const setState: SetState<T> = (newState) => {
    currentState = newState(currentState);

    effectProcessor.triggerEffects();
    flushQueue();

    return currentState;
  };

  const buildActions = (): StoreActions<T, U> => {
    const actions: any = {};
    if (options?.actions) {
      for (const actionName in options.actions) {
        actions[actionName] = (...args: any[]) => options.actions?.[actionName](currentState, setState, ...args);
      }
    }
    return actions;
  };

  return {
    getState: () => currentState,
    computed: computed,
    setState: setState,
    actions: buildActions(),
    useEffect: useEffectWithState,
    compute: computeWithState,
    persist: configurePersistence,
    loadFromPersistence: loadFromPersistence,
    dropPersistence: dropPersistence,
    nextTick: () => queueFlushedPromise,
  };
};