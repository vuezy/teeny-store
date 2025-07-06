import type { TaskQueue } from "./queue";

export type ComputedDeps = unknown[] & { 0: unknown };

interface ComputedEntry {
  computation: () => unknown;
  deps: ComputedDeps;
  depsFn: () => ComputedDeps;
  sync: boolean;
};

export interface ComputeOptions {
  sync?: boolean;
};
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => unknown;

export interface UseComputedSystemParams {
  queue: TaskQueue;
};

export function useComputedSystem({ queue }: UseComputedSystemParams) {
  const computedProperties: Record<string, unknown> = {};
  const computedEntries = new Map<string, ComputedEntry>();

  const compute: ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions): unknown => {
    const entry: ComputedEntry = {
      computation: computation,
      deps: depsFn(),
      depsFn: depsFn,
      sync: options?.sync ?? false,
    };

    recompute(name, entry);
    computedEntries.set(name, entry);
    
    return computedProperties[name];
  };

  const triggerRecomputation = () => {
    for (const [name, entry] of computedEntries) {
      const newDepValues = entry.depsFn();
      const shouldRecompute = entry.deps.some((prevDep, idx) => newDepValues[idx] !== prevDep);

      if (shouldRecompute) {
        entry.deps = newDepValues;
        if (entry.sync) {
          recompute(name, entry);
        } else {
          queue.add(name, () => recompute(name, entry));
        }
      }
    }
  };

  const recompute = (name: string, entry: ComputedEntry) => {
    computedProperties[name] = entry.computation();
  };

  return {
    computed: computedProperties,
    compute,
    triggerRecomputation,
  };
};

export type UseComputedSystemReturn = ReturnType<typeof useComputedSystem>;