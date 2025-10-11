import { createEffectProcessor } from "../src/effectProcessor";
import { createTaskQueue } from "../src/queue";

export function createProcessorWithQueue() {
  const queue = createTaskQueue();
  const processor = createEffectProcessor({ queue });
  return { processor, flushQueue: queue.flush };
};