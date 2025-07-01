export interface EffectQueue {
  add: (key: PropertyKey, action: () => void) => void;
  flush: () => Promise<void>;
};

export function createEffectQueue(): EffectQueue {
  const queue = new Map<PropertyKey, () => void>();

  const add = (key: PropertyKey, action: () => void) => {
    queue.set(key, action);
  };

  const flush = async () => {
    return Promise.resolve().then(() => {
      for (const action of queue.values()) {
        action();
      }
      queue.clear();
    });
  };

  return {
    add,
    flush,
  };
};