/**
 * @param key - A unique key for the task.
 * @param task - A function that performs a task.
 */
export type EnqueueFn = (key: PropertyKey, task: () => void) => void;

/**
 * Represents a queue for processing tasks in order.
 */
export interface TaskQueue {
  /**
   * Get the size of the queue.
   */
  size: () => number;

  /**
   * Add a task to the queue.
   */
  add: EnqueueFn;

  /**
   * Process all tasks in the queue and clear it.
   */
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