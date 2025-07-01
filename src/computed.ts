import type { EffectQueue } from "./queue";
import type { ComputeFn } from "./types";

interface ComputedEntry {
  computation: () => unknown;
  deps: unknown[];
  depsFn: () => unknown[];
};

export interface UseComputedLogicParams {
  effectQueue: EffectQueue;
};

export function useComputedLogic({ effectQueue }: UseComputedLogicParams) {
  const computedProperties: Record<string, unknown> = {};
  const computedEntries = new Map<string, ComputedEntry>();

  const compute: ComputeFn = (name: string, computation: () => unknown, depsFn: () => unknown[]): unknown => {
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
        effectQueue.add(name, () => {
          computedProperties[name] = entry.computation();
        });
      }
    }
  };

  return {
    computedProperties,
    compute,
    triggerRecomputation,
  };
};

export type UseComputedLogicReturn = ReturnType<typeof useComputedLogic>;