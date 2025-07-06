import type { TaskQueue } from "./queue";

export type ComputedDeps = unknown[] & { 0: unknown };

interface ComputedEntry {
  computation: () => unknown;
  deps: ComputedDeps;
  depsFn: () => ComputedDeps;
};

export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps) => unknown;

export interface UseComputedSystemParams {
  queue: TaskQueue;
};

export function useComputedSystem({ queue }: UseComputedSystemParams) {
  const computedProperties: Record<string, unknown> = {};
  const computedEntries = new Map<string, ComputedEntry>();

  const compute: ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps): unknown => {
    computedEntries.set(name, {
      computation: computation,
      deps: depsFn(),
      depsFn: depsFn,
    });

    computedProperties[name] = computation();
    return computedProperties[name];
  };

  const triggerRecomputation = () => {
    for (const [name, entry] of computedEntries) {
      const newDepValues = entry.depsFn();
      const shouldRecompute = entry.deps.some((prevDep, idx) => newDepValues[idx] !== prevDep);

      if (shouldRecompute) {
        entry.deps = newDepValues;
        queue.add(name, () => {
          computedProperties[name] = entry.computation();
        });
      }
    }
  };

  return {
    computed: computedProperties,
    compute,
    triggerRecomputation,
  };
};

export type UseComputedSystemReturn = ReturnType<typeof useComputedSystem>;