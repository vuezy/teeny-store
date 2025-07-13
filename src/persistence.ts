const validStorages = ['localStorage', 'sessionStorage'] as const;
export type ValidStorage = typeof validStorages[number];

export interface PersistenceOptions {
  storage: ValidStorage;
  key: string;
};

export function usePersistence() {
  const getFromStorage = ({ storage, key }: PersistenceOptions): unknown => {
    if (isStorageValid(storage)) {
      const json = window[storage].getItem(key);
      return json ? JSON.parse(json) : undefined;
    }
  };

  const persist = (data: unknown, { storage, key }: PersistenceOptions) => {
    if (isStorageValid(storage)) {
      window[storage].setItem(key, JSON.stringify(data));
    }
  };

  const isStorageValid = (storage: ValidStorage): boolean => {
    return validStorages.includes(storage);
  };

  return {
    getFromStorage,
    persist,
  };
};

export type UsePersistenceReturn = ReturnType<typeof usePersistence>;