const validStorages = ['localStorage', 'sessionStorage'] as const;
type ValidStorage = typeof validStorages[number];

export interface PersistenceOptions {
  storage: ValidStorage;
  key: string;
};

export function usePersistence() {
  const persistence: Partial<PersistenceOptions> = {};

  const setStorage = ({ storage, key }: PersistenceOptions) => {
    if (isValidStorage(storage)) {
      persistence.storage = storage;
      persistence.key = key;
    }
  };

  const get = (persistenceOptions?: PersistenceOptions): unknown => {
    const selectedPersistence = persistenceOptions ?? persistence;
    if (isSet(selectedPersistence)) {
      const json = window[selectedPersistence.storage].getItem(selectedPersistence.key);
      return json !== null ? JSON.parse(json) : undefined;
    }
    return undefined;
  };

  const persist = (data: unknown) => {
    if (isSet(persistence)) {
      window[persistence.storage].setItem(persistence.key, JSON.stringify(data));
    }
  };

  const remove = () => {
    if (isSet(persistence)) {
      window[persistence.storage].removeItem(persistence.key);
    }
    persistence.storage = undefined;
    persistence.key = undefined;
  };

  const isSet = (persistence: Partial<PersistenceOptions>): persistence is PersistenceOptions => {
    return persistence.storage !== undefined && persistence.key !== undefined && isValidStorage(persistence.storage);
  };

  const isValidStorage = (storage: ValidStorage): boolean => validStorages.includes(storage);

  return {
    setStorage,
    get,
    persist,
    remove,
  };
};

export type UsePersistenceReturn = ReturnType<typeof usePersistence>;