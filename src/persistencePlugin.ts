import type { StorePluginFn } from "./types/store";

const validStorages = ['localStorage', 'sessionStorage'] as const;
type ValidStorage = typeof validStorages[number];

export interface PersistenceOptions {
  /**
   * The type of persistent storage to use.
   */
  storage: ValidStorage;

  /**
   * The storage key name.
   */
  key: string;
};

/**
 * @param options - {@link ConfigurePersistenceOptions}.
 */
export type ConfigurePersistence = (options: ConfigurePersistenceOptions) => void;

export type ConfigurePersistenceOptions = PersistenceOptions & {
  /**
   * Whether to clear the previously used persistent storage.
   */
  clearPrev?: boolean;
};

/**
 * @template TState - The type of the state.
 */
export type StorePersistenceOptions<TState> = PersistenceOptions & {
  /**
   * The function to be run after data is loaded from the storage and before it is used to update the state.
   * @param data - The data retrieved from the storage.
   * @returns The new state.
   */
  onLoaded?: (data: TState) => TState;
};

/**
 * Represents extra properties/methods added to the store when the persistence plugin is used.
 * @template TState - The type of the state.
 */
export interface PersistenceProps<TState> {
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
};

/**
 * Create a plugin that enables state persistence.
 * @param options - {@link StorePersistenceOptions}.
 * @returns The persistence plugin.
 */
export function createPersistencePlugin<TState>(options?: StorePersistenceOptions<TState>): StorePluginFn<TState, PersistenceProps<TState>> {
  return (getState, setState, effectProcessor) => {
    const persistence: Partial<PersistenceOptions> = {};
    const isValidStorage = (storage: ValidStorage) => validStorages.includes(storage);
    const isSet = (persistence: Partial<PersistenceOptions>): persistence is PersistenceOptions => {
      return persistence.storage !== undefined && persistence.key !== undefined && isValidStorage(persistence.storage);
    };

    const setStorage = ({ storage, key }: PersistenceOptions) => {
      if (isValidStorage(storage)) {
        persistence.storage = storage;
        persistence.key = key;
      } else {
        throw new Error('Only `localStorage` and `sessionStorage` can be used for persistence.');
      }
    };

    const getFromStorage = (persistenceOptions?: PersistenceOptions): TState|undefined => {
      const selectedPersistence = persistenceOptions ?? persistence;
      if (isSet(selectedPersistence)) {
        const json = window[selectedPersistence.storage].getItem(selectedPersistence.key);
        return json !== null ? JSON.parse(json) : undefined;
      }
      return undefined;
    };

    const persistToStorage = (data: TState) => {
      if (isSet(persistence)) {
        window[persistence.storage].setItem(persistence.key, JSON.stringify(data));
      }
    };

    const removeStorage = () => {
      if (isSet(persistence)) {
        window[persistence.storage].removeItem(persistence.key);
      }
      persistence.storage = undefined;
      persistence.key = undefined;
    };

    const configurePersistence: ConfigurePersistence = ({ storage, key, clearPrev }) => {
      if (clearPrev) {
        removeStorage();
      }
      setStorage({ storage, key });
      persistToStorage(getState());
    };

    const loadFromPersistence = (options: StorePersistenceOptions<TState>) => {
      const persistedState = getFromStorage({ storage: options.storage, key: options.key });
      if (persistedState !== undefined) {
        setState(() => options.onLoaded?.(persistedState) ?? persistedState);
      }
    };

    const initializePersistence = () => {
      if (options) {
        setStorage(options);

        const persistedState = getFromStorage();
        if (persistedState !== undefined) {
          if (options.onLoaded) {
            const newState = options.onLoaded(persistedState);
            setState(() => newState);
            persistToStorage(newState);
          } else {
            setState(() => persistedState);
          }
        } else {
          persistToStorage(getState());
        }
      }

      effectProcessor.trackEffect(Symbol('persistence'), () => persistToStorage(getState()), undefined, { immediate: false });
    };

    initializePersistence();

    return {
      persist: configurePersistence,
      loadFromPersistence,
      dropPersistence: removeStorage,
    };
  };
};