export type EnqueueFn = (key: PropertyKey, task: () => void) => void;

export interface TaskQueue {
  size: () => number;
  add: EnqueueFn;
  flush: () => Promise<void>;
};

export function createTaskQueue(): TaskQueue {
  const queue = new Map<PropertyKey, () => void>();

  const size = () => queue.size;

  const add: EnqueueFn = (key, task) => {
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