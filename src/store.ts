/* eslint-disable @typescript-eslint/no-explicit-any */
import { createComputationService, type ComputedDeps, type ComputeOptions, type ComputeReturn } from "./computationService";
import { createEffectService, type UseEffectOptions } from "./effectService";
import { createTaskQueue, type TaskQueue } from "./queue";
import { usePersistence, type PersistenceOptions } from "./persistence";
import { createEffectProcessor, type EffectProcessor, type ToggleEffectActive } from "./effectProcessor";

/**
 * @template TState - The type of the state.
 * @param newState - The function that receives the current state value and returns a new state value.
 * @returns A new state value.
 */
export type SetState<TState> = (newState: (state: TState) => TState) => TState;

/**
 * @template TState - The type of the state.
 * @param state - The current state value.
 * @param setState - The function to update the state.
 * @param ...args - Additional data to be passed to the action function.
 * @returns A new state value or `void`.
 */
export type ActionFn<TState> = (state: TState, setState: SetState<TState>, ...args: any[]) => TState | void;

/**
 * Represents an action collection object where the keys are action names and the values are action functions.
 * @template TState - The type of the state.
 */
export type ActionFnRecord<TState> = Record<string, ActionFn<TState>>;

/**
 * Represents a transformed interface where action functions ({@link ActionFn}) are converted to cleaner action functions that no longer expect the `state` and `setState` parameters.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 */
export type StoreActions<TState, TActions> = {
  [K in keyof TActions]: TActions[K] extends (state: TState, setState: SetState<TState>, ...args: infer Args) => TState | void
    ? (...args: Args) => TState | void
    : never;
};

/**
 * @template TState - The type of the state.
 * @param effect - The function that performs the effect. It receives the current state as the argument. If the return value is a function, it will be called before each effect re-run as the cleanup function.
 * @param depsFn - The function that resolves the effect's current dependency values. It receives the current state as the argument.
 * @param options - {@link UseEffectOptions}.
 * @returns A function to toggle the active state of the effect.
 */
export type UseEffectWithState<TState> = (effect: (state: TState) => unknown, depsFn?: (state: TState) => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

/**
 * @template TState - The type of the state.
 * @param name - A unique name for the computed value, which is used as a key in the {@link TeenyStore.computed computed} property.
 * @param computation - The function that performs the computation. It receives the current state as the argument. The return value is the computation result.
 * @param depsFn - The function that resolves the dependency values of the computation. It receives the current state as the argument.
 * @param options - {@link ComputeOptions}.
 * @returns An object containing the computation result and a function to toggle the active state of the computation. See {@link ComputeReturn}.
 */
export type ComputeWithState<TState> = (name: string, computation: (state: TState) => unknown, depsFn: (state: TState) => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

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

export type StorePersistenceOptions<TState> = PersistenceOptions & {
  /**
   * The function to be run after data is loaded from the storage and before it is used to update the state.
   * @param data - The data retrieved from the storage.
   * @returns The new state.
   */
  onLoaded?: (data: TState) => TState;
};

/**
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 */
export interface CreateStoreOptions<TState, TActions extends ActionFnRecord<TState>> {
  /**
   * The action collection object.  
   * The keys are action names and the values are action functions.
   */
  actions?: TActions;

  /**
   * The persistence options.  
   * Enabling persistence also sets up a side effect that saves the state to the storage whenever it changes.
   * See {@link StorePersistenceOptions}.
   */
  persistence?: StorePersistenceOptions<TState>;
};

/**
 * Represents a plugin function to extend Teeny Store.
 * @template TState - The type of the state.
 * @template TExtProps - The type of the object containing custom properties/methods.
 * @param getState - The function to get the current state in the store.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects.
 * @param queue - The queue used for processing scheduled effects.
 * @returns A Teeny Store plugin function.
 */
export type StorePluginFn<
  TState,
  TExtProp extends object = object,
> = (getState: () => TState, effectProcessor: EffectProcessor, queue: TaskQueue) => TExtProp|void;

/**
 * Represents a Teeny Store builder.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 * @template TExtProps - The type of the object containing custom properties/methods.
 */
export interface StoreBuilder<
  TState,
  TActions extends ActionFnRecord<TState> = ActionFnRecord<TState>,
  TExtProps extends object = object,
> {
  /**
   * Mark a function as a Teeny Store plugin for better type inference.
   * @param fn - The function to be marked as a plugin.
   * @returns The same function with better type information.
   */
  definePlugin: <TExtProp extends object>(fn: StorePluginFn<TState, TExtProp>) => StorePluginFn<TState, TExtProp>,

  /**
   * Use a plugin to extend the store with custom behaviors.
   * @param plugin - The plugin function.
   * @returns The {@link StoreBuilder Teeny Store builder}.
   */
  use: <TExtProp extends object>(plugin: StorePluginFn<TState, TExtProp>) => StoreBuilder<TState, TActions, TExtProps & TExtProp>,

  /**
   * Create a {@link TeenyStore Teeny Store} instance.
   * @returns A {@link TeenyStore Teeny Store} instance.
   */
  create: () => keyof TExtProps extends never ? TeenyStore<TState, TActions> : TeenyStoreWithExtProps<TState, TActions, TExtProps>,
};

/**
 * Represents a Teeny Store instance for state and effect management.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 */
export interface TeenyStore<TState, TActions> {
  /**
   * Get the current state.
   * @returns The current state.
   */
  getState: () => TState;

  /**
   * A collection of computed values (results from the {@link TeenyStore.compute compute} method).
   */
  computed: Record<PropertyKey, unknown>;

  /**
   * Update the state and trigger side effects.
   */
  setState: SetState<TState>;

  /**
   * A collection of action functions that abstract the logic for updating the state.
   */
  actions: StoreActions<TState, TActions>;

  /**
   * Perform an effect in response to dependency changes.
   */
  useEffect: UseEffectWithState<TState>;

  /**
   * Compute a value in response to dependency changes.
   */
  compute: ComputeWithState<TState>;

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
  loadFromPersistence: (options: StorePersistenceOptions<TState>) => void;

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
 * Represents a Teeny Store instance for state and effect management.  
 * It is the same as {@link TeenyStore}, but contains custom properties/methods.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 * @template TExtProps - The type of the object containing custom properties/methods.
 */
export type TeenyStoreWithExtProps<
  TState,
  TActions extends ActionFnRecord<TState> = ActionFnRecord<TState>,
  TExtProps extends object = object,
> = { [K in keyof (TeenyStore<TState, TActions> & TExtProps)]: (TeenyStore<TState, TActions> & TExtProps)[K] } & {};

/**
 * Create a {@link StoreBuilder Teeny Store builder}.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 * @template TExtProps - The type of the object containing custom properties/methods.
 * @param state - The initial state in the store.
 * @param options - {@link CreateStoreOptions}.
 * @returns A {@link StoreBuilder Teeny Store builder}.
 */
export function defineStore<
  TState,
  TActions extends ActionFnRecord<TState> = ActionFnRecord<TState>,
  TExtProps extends object = object,
>(
  state: TState,
  options?: CreateStoreOptions<TState, TActions>,
  plugins: StorePluginFn<TState>[] = [],
): StoreBuilder<TState, TActions, TExtProps> {
  return {
    definePlugin: (fn) => fn,
    use: (plugin) => defineStore(state, options, [...plugins, plugin]),
    create: () => {
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
      const loadFromPersistence = (options: StorePersistenceOptions<TState>) => {
        const persistedState = getFromStorage({ storage: options.storage, key: options.key });
        if (persistedState !== undefined) {
          setState(() => options.onLoaded?.(persistedState as TState) ?? persistedState as TState);
        }
      };

      if (options?.persistence) {
        setStorage({ storage: options.persistence.storage, key: options.persistence.key });

        const persistedState = getFromStorage();
        if (persistedState !== undefined) {
          if (options.persistence.onLoaded) {
            currentState = options.persistence.onLoaded?.(persistedState as TState);
            persist(currentState);
          } else {
            currentState = persistedState as TState;
          }
        } else {
          persist(currentState);
        }
      }

      const effectProcessor = createEffectProcessor({ queue });
      effectProcessor.trackEffect(Symbol('persistence'), () => persist(currentState), undefined, { immediate: false });
      const { useEffect } = createEffectService(effectProcessor);
      const { computed, compute } = createComputationService(effectProcessor);

      const useEffectWithState: UseEffectWithState<TState> = (effect, depsFn, options) => {
        return useEffect(() => effect(currentState), depsFn ? () => depsFn(currentState) : undefined, options);
      };

      const computeWithState: ComputeWithState<TState> = (name, computation, depsFn, options) => {
        return compute(name, () => computation(currentState), () => depsFn(currentState), options);
      };

      const getState = () => currentState;
      const setState: SetState<TState> = (newState) => {
        currentState = newState(currentState);

        effectProcessor.triggerEffects();
        flushQueue();

        return currentState;
      };

      const buildActions = (): StoreActions<TState, TActions> => {
        const actions: any = {};
        if (options?.actions) {
          for (const actionName in options.actions) {
            actions[actionName] = (...args: any[]) => options.actions?.[actionName](currentState, setState, ...args);
          }
        }
        return actions;
      };

      const customProps = plugins.map(plugin => plugin(getState, effectProcessor, queue));

      return Object.assign({
        getState: getState,
        computed: computed,
        setState: setState,
        actions: buildActions(),
        useEffect: useEffectWithState,
        compute: computeWithState,
        persist: configurePersistence,
        loadFromPersistence: loadFromPersistence,
        dropPersistence: dropPersistence,
        nextTick: () => queueFlushedPromise,
      }, ...customProps);
    },
  };
};

/**
 * Create a plain {@link TeenyStore Teeny Store} instance.
 * @template TState - The type of the state.
 * @template TActions - The type of the action collection object.
 * @param state - The initial state in the store.
 * @param options - {@link CreateStoreOptions}.
 * @returns A {@link TeenyStore Teeny Store} instance.
 */
export function createStore<
  TState,
  TActions extends ActionFnRecord<TState> = ActionFnRecord<TState>,
>(state: TState, options?: CreateStoreOptions<TState, TActions>): TeenyStore<TState, TActions> {
  return defineStore(state, options).create();
};