import type { EffectFn, UseEffect, UseEffectOptions } from "./types";

interface EffectEntry {
  effect: EffectFn;
  deps?: unknown[];
  depsFn?: () => unknown[];
  cleanup?: () => void;
  hasRun: boolean;
  once: boolean;
};

export function useEffectLogic() {
  const effectEntries: EffectEntry[] = [];
  const effectQueue = new Set<EffectEntry>;
  let effectExecutionPromise: Promise<void>;

  const withDefaultUseEffectOptions = (options?: UseEffectOptions): Required<UseEffectOptions> => {
    return {
      immediate: options?.immediate === undefined ? true : options.immediate,
      once: options?.once === undefined ? false : options.once,
    };
  };

  const useEffect: UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => {
    const resolvedOptions = withDefaultUseEffectOptions(options);
    
    const effectEntry: EffectEntry = {
      effect: effect,
      deps: depsFn?.(),
      depsFn: depsFn,
      hasRun: false,
      once: resolvedOptions.once,
    };

    if (resolvedOptions.immediate) {
      runEffect(effectEntry);
    }
    effectEntries.push(effectEntry);
  };

  const triggerEffects = () => {
    for (let i = 0; i < effectEntries.length; i++) {
      const effectEntry = effectEntries[i];
      let shouldRunEffect = false;

      if (!effectEntry.once || (effectEntry.once && !effectEntry.hasRun)) {
        const newDepValues = effectEntry.depsFn?.();

        if (newDepValues === undefined) {
          shouldRunEffect = true;
        } else if (effectEntry.deps === undefined) {
          shouldRunEffect = true;
        } else if (effectEntry.deps.length === 0) {
          shouldRunEffect = !effectEntry.hasRun;
        } else {
          shouldRunEffect = effectEntry.deps.some((prevDep, idx) => newDepValues[idx] !== prevDep);
        }

        if (shouldRunEffect) {
          effectEntry.deps = newDepValues;
          queueEffect(effectEntry);
        }
      }
    }

    if (effectQueue.size > 0) {
      effectExecutionPromise = flushEffectQueue();
    }
  };

  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.cleanup?.();
    const cleanup = effectEntry.effect();
    if (cleanup) {
      effectEntry.cleanup = cleanup;
    }
    effectEntry.hasRun = true;
  };

  const queueEffect = (effectEntry: EffectEntry) => {
    effectQueue.add(effectEntry);
  };

  const flushEffectQueue = async () => {
    return Promise.resolve().then(() => {
      for (const effectEntry of effectQueue) {
        runEffect(effectEntry);
      }
      effectQueue.clear();
    });
  };

  const getEffectExecutionPromise = () => effectExecutionPromise;

  return {
    useEffect,
    triggerEffects,
    getEffectExecutionPromise,
  };
};

export type UseEffectLogicReturn = ReturnType<typeof useEffectLogic>;