import type { DefineEffects, EffectFn, UseEffect, UseEffectOptions } from "./types";

interface EffectEntry {
  effect: EffectFn;
  deps?: unknown[];
  cleanup?: () => void;
  hasRun?: boolean;
};

export interface UseEffectLogicOptions {
  dynamic?: boolean;
};

export function useEffectLogic({ dynamic }: UseEffectLogicOptions) {
  let setUpEffects = () => {};
  let effectEntryIdx = 0;
  const effectEntries = dynamic ? new Map<PropertyKey, EffectEntry>() : [] as EffectEntry[];
  const effectQueue = new Map<PropertyKey, () => void>();
  let effectExecutionPromise: Promise<void>;

  const initiateEffects = (defineEffects: DefineEffects) => {
    setUpEffects = () => {
      defineEffects(useEffect);
      effectExecutionPromise = flushEffectQueue();
      resetEffectEntryIdx();
    };
    runEffectSetup();
  };

  const runEffectSetup = () => setUpEffects();

  const getEffectExecutionPromise = () => effectExecutionPromise;

  const resetEffectEntryIdx = () => {
    effectEntryIdx = 0;
  };

  const withDefaultUseEffectOptions = (options: UseEffectOptions): Required<UseEffectOptions> => {
    return {
      key: dynamic ? (options.key ?? effectEntryIdx) : effectEntryIdx,
      immediate: options.immediate === undefined ? true : options.immediate,
      once: options.once === undefined ? false : options.once,
    };
  };

  const useEffect: UseEffect = (effect: EffectFn, deps?: unknown[], options: UseEffectOptions = { immediate: true }) => {
    const resolvedOptions = withDefaultUseEffectOptions(options);
    const effectKey = resolvedOptions.key;
    let shouldRunEffect = false;

    let effectEntry = Array.isArray(effectEntries) ? effectEntries[effectEntryIdx] : effectEntries.get(effectKey);
    if (!effectEntry) {
      effectEntry = {
        effect: effect,
        deps: deps,
      };

      if (Array.isArray(effectEntries)) {
        effectEntries.push(effectEntry);
      } else {
        effectEntries.set(effectKey, effectEntry);
      }
      
      shouldRunEffect = resolvedOptions.immediate;
    } else {
      if (!resolvedOptions.once || (resolvedOptions.once && !effectEntry.hasRun)) {
        const prevDeps = effectEntry.deps;

        if (prevDeps === undefined || deps === undefined) {
          shouldRunEffect = true;
        } else if (Array.isArray(prevDeps) && prevDeps.length === 0) {
          shouldRunEffect = !effectEntry.hasRun;
        } else if (Array.isArray(prevDeps) && Array.isArray(deps)) {
          shouldRunEffect = prevDeps.some(function (prevDep, idx) {
            return deps[idx] !== prevDep;
          });
          effectEntry.deps = deps;
        } else {
          shouldRunEffect = false;
          effectEntry.deps = deps;
        }
      }
    }

    if (shouldRunEffect) {
      if (resolvedOptions.immediate && !effectEntry.hasRun) {
        runEffect(effectEntry);
      } else {
        queueEffect(effectKey, effectEntry);
      }
    }

    effectEntryIdx++;
  };

  const runEffect = (effectEntry: EffectEntry) => {
    if (effectEntry.hasRun && effectEntry.cleanup) {
      effectEntry.cleanup();
    }
    const cleanup = effectEntry.effect();
    if (cleanup) {
      effectEntry.cleanup = cleanup;
    }
    effectEntry.hasRun = true;
  };

  const queueEffect = (key: PropertyKey, effectEntry: EffectEntry) => {
    effectQueue.set(key, () => runEffect(effectEntry));
  };

  const flushEffectQueue = async () => {
    return Promise.resolve().then(() => {
      for (const effect of effectQueue.values()) {
        effect();
      }
      effectQueue.clear();
    });
  };

  return {
    initiateEffects,
    runEffectSetup,
    getEffectExecutionPromise,
  };
};

export type UseEffectLogicReturn = ReturnType<typeof useEffectLogic>;