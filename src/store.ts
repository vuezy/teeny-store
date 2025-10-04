/* eslint-disable @typescript-eslint/no-explicit-any */
import { createComputationService, type ComputedDeps, type ComputeOptions, type ComputeReturn } from "./computationService";
import { createEffectService, type UseEffectOptions } from "./effectService";
import { createTaskQueue } from "./queue";
import { usePersistence, type PersistenceOptions } from "./persistence";
import { createEffectProcessor, type ToggleEffectActive } from "./effectProcessor";

/**
 * @template T - The type of the state.
 * @param newState - The function that receives the current state value and returns a new state value.
 * @returns A new state value.
 */
export type SetState<T> = (newState: (state: T) => T) => T;

/**
 * @template T - The type of the state.
 * @returns A new state value or `void`.
 */
export type ActionFn<T> = (state: T, setState: SetState<T>, ...args: any[]) => T | void;

/**
 * Represents an action collection object where the keys are action names and the values are action functions.
 * @template T - The type of the state.
 */
export type ActionFnRecord<T> = Record<string, ActionFn<T>>;

/**
 * Represents a transformed interface where action functions ({@link ActionFn}) are converted to cleaner action functions that no longer expect the `state` and `setState` parameters.
 * @template T - The type of the state.
 * @template U - The type of the action collection object.
 */
export type StoreActions<T, U> = {
  [K in keyof U]: U[K] extends (state: T, setState: SetState<T>, ...args: infer Args) => T | void
    ? (...args: Args) => T | void
    : never;
};

/**
 * @template T - The type of the state.
 * @param effect - The function that performs the effect. It receives the current state as the argument. If the return value is a function, it will be called before each effect re-run as the cleanup function.
 * @param depsFn - The function that resolves the effect's current dependency values. It receives the current state as the argument.
 * @param options - {@link UseEffectOptions}.
 * @returns A function to toggle the active state of the effect.
 */
export type UseEffectWithState<T> = (effect: (state: T) => unknown, depsFn?: (state: T) => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

/**
 * @template T - The type of the state.
 * @param name - A unique name for the computed value, which is used as a key in the {@link TeenyStore.computed computed} property.
 * @param computation - The function that performs the computation. It receives the current state as the argument. The return value is the computation result.
 * @param depsFn - The function that resolves the dependency values of the computation. It receives the current state as the argument.
 * @param options - {@link ComputeOptions}.
 * @returns An object containing the computation result and a function to toggle the active state of the computation. See {@link ComputeReturn}.
 */
export type ComputeWithState<T> = (name: string, computation: (state: T) => unknown, depsFn: (state: T) => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

export type ConfigurePersistenceOptions = PersistenceOptions & {
  /**
   * Whether to clear the previously used persistent storage.
   */
  clearPrev?: boolean;
};

/**
 * @param options - {@link ConfigurePersistenceOptions}.
 */
export type ConfigurePersistence = (options: ConfigurePersistenceOptions) => void;

export type StorePersistenceOptions<T> = PersistenceOptions & {
  /**
   * The function to be run after data is loaded from the storage and before it is used to update the state.
   * @param data - The data retrieved from the storage.
   * @returns The new state.
   */
  onLoaded?: (data: T) => T;
};

/**
 * @template T - The type of the state.
 * @template U - The type of the action collection object.
 */
export interface CreateStoreOptions<T, U extends ActionFnRecord<T>> {
  /**
   * The action collection object.  
   * The keys are action names and the values are action functions.
   */
  actions?: U;

  /**
   * The persistence options.  
   * Enabling persistence also sets up a side effect that saves the state to the storage whenever it changes.
   * See {@link StorePersistenceOptions}.
   */
  persistence?: StorePersistenceOptions<T>;
};

/**
 * Represents a Teeny Store instance for state and effect management.
 * @template T - The type of the state.
 * @template U - The type of the action collection object.
 */
export interface TeenyStore<T, U> {
  /**
   * Get the current state.
   * @returns The current state.
   */
  getState: () => T;

  /**
   * A collection of computed values (results from the {@link TeenyStore.compute compute} method).
   */
  computed: Record<PropertyKey, unknown>;

  /**
   * Update the state and trigger side effects.
   */
  setState: SetState<T>;

  /**
   * A collection of action functions that abstract the logic for updating the state.
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
   * Set up or reconfigure state persistence.  
   * This method defines a side effect that persists the state to the configured storage on every change.
   */
  persist: ConfigurePersistence;

  /**
   * Load data from a persistent storage to update the state.  
   * This method will also trigger side effects.
   * @param options - {@link StorePersistenceOptions}.
   */
  loadFromPersistence: (options: StorePersistenceOptions<T>) => void;

  /**
   * Turn off persistence and clear stored state.
   */
  dropPersistence: () => void;

  /**
   * Wait until all side effects have been processed.
   * @returns A promise that resolves when all side effects have been processed.
   */
  nextTick: () => Promise<void>;
};

/**
 * Create a {@link TeenyStore} instance.
 * @template T - The type of the state.
 * @template U - The type of the action collection object.
 * @param state - The initial state in the store.
 * @param options - {@link CreateStoreOptions}.
 * @returns A {@link TeenyStore}.
 */
export function createStore<T, U extends ActionFnRecord<T> = ActionFnRecord<T>>(
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