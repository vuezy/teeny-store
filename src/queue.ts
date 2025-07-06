export interface TaskQueue {
  size: () => number;
  add: (key: PropertyKey, action: () => void) => void;
  flush: () => Promise<void>;
};

export function createTaskQueue(): TaskQueue {
  const queue = new Map<PropertyKey, () => void>();

  const size = () => queue.size;

  const add = (key: PropertyKey, task: () => void) => {
    queue.set(key, task);
  };

  const flush = async () => {
    return Promise.resolve().then(() => {
      for (const task of queue.values()) {
        task();
      }
      queue.clear();
    });
  };

  return {
    size,
    add,
    flush,
  };
};