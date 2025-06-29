import type { ComputeFn } from "./types";

interface ComputedEntry {
  computation: () => unknown;
  deps: unknown[];
  depsFn: () => unknown[];
};

export function useComputedLogic() {
  const computedProperties: Record<string, unknown> = {};
  const computedEntries = new Map<string, ComputedEntry>();
  const computationQueue = new Map<string, () => unknown>();
  let computationPromise: Promise<void>;

  const compute: ComputeFn = (name: string, computation: () => unknown, depsFn: () => unknown[]) => {
    computedEntries.set(name, {
      computation: computation,
      deps: depsFn(),
      depsFn: depsFn,
    });

    computedProperties[name] = computation();
    return computedProperties[name];
  };

  const recompute = () => {
    for (const [name, entry] of computedEntries) {
      const newDepValues = entry.depsFn();
      const shouldRecompute = entry.deps.some((prevDep, idx) => newDepValues[idx] !== prevDep);
      if (shouldRecompute) {
        computationQueue.set(name, () => {
          computedProperties[name] = entry.computation();
        });
        entry.deps = newDepValues;
      }
    }

    computationPromise = flushComputationQueue();
  };

  const getComputationPromise = () => computationPromise;

  const flushComputationQueue = async () => {
    await Promise.resolve().then(() => {
      for (const computation of computationQueue.values()) {
        computation();
      }
      computationQueue.clear();
    });
  };

  return {
    computedProperties,
    compute,
    recompute,
    getComputationPromise,
  };
};

export type UseComputedLogicReturn = ReturnType<typeof useComputedLogic>;