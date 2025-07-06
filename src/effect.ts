import type { TaskQueue } from "./queue";

export type EffectFn = (() => void | (() => void));

interface EffectEntry {
  effect: EffectFn;
  deps?: unknown[];
  depsFn?: () => unknown[];
  cleanup?: () => void;
  hasRun: boolean;
  once: boolean;
};

export interface UseEffectOptions {
  immediate?: boolean;
  once?: boolean;
};
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => void;

export interface UseEffectSystemParams {
  queue: TaskQueue;
};

export function useEffectSystem({ queue }: UseEffectSystemParams) {
  const effectEntries: EffectEntry[] = [];

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
    for (let idx = 0; idx < effectEntries.length; idx++) {
      const effectEntry = effectEntries[idx];
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
          queue.add(idx, () => runEffect(effectEntry));
        }
      }
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

  return {
    useEffect,
    triggerEffects,
  };
};

export type UseEffectSystemReturn = ReturnType<typeof useEffectSystem>;