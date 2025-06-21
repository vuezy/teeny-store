export interface TeenyStore<T> {
  getState: () => T;
  setState: (newState: T) => T;
  trackEffects: (registerEffects: RegisterEffects) => void;
  effectExecution: () => Promise<void>;
};

export type RegisterEffects = (useEffect: UseEffect) => void;
export type UseEffect = (effect: EffectFn, deps?: unknown[], options?: UseEffectOptions) => void;
export interface UseEffectOptions {
  key?: PropertyKey;
  immediate?: boolean;
  once?: boolean;
};

type EffectFn = () => void | (() => void);

interface EffectEntry {
  effect: EffectFn;
  deps?: unknown[];
  cleanup?: () => void;
  hasRun?: boolean;
};

export function createStore<T>(state: T): TeenyStore<T> {
  let currentState = state;

  let registerEffectsFn = () => {};
  let effectEntryIdx = 0;
  const effectEntries = new Map<PropertyKey, EffectEntry>();
  const effectQueue = new Map<PropertyKey, () => void>();
  let effectPromise: Promise<void>;

  const useEffect: UseEffect = (effect: EffectFn, deps?: unknown[], options: UseEffectOptions = { immediate: true }) => {
    if (options.immediate === undefined) {
      options.immediate = true;
    }

    const effectKey = options.key ?? effectEntryIdx;
    let shouldRunEffect = false;

    let effectEntry = effectEntries.get(effectKey);
    if (!effectEntry) {
      effectEntry = {
        effect: effect,
        deps: deps,
      };
      effectEntries.set(effectKey, effectEntry);
      
      shouldRunEffect = options.immediate;
    } else if (!options.once || (options.once && !effectEntry.hasRun)) {
      const prevDeps = effectEntry.deps;

      if (prevDeps === undefined || deps === undefined) {
        shouldRunEffect = true;
      } else if (Array.isArray(prevDeps) && prevDeps.length === 0) {
        shouldRunEffect = !effectEntry.hasRun;
      } else {
        shouldRunEffect = false;

        if (Array.isArray(prevDeps) && Array.isArray(deps)) {
          shouldRunEffect = prevDeps.some(function (prevDep, idx) {
            return deps[idx] !== prevDep;
          });
        }

        effectEntry.deps = deps;
      }
    }

    if (shouldRunEffect) {
      const runEffect = () => {
        const cleanup = effect();
        if (cleanup) {
          effectEntry.cleanup = cleanup;
        }
        effectEntry.hasRun = true;
      };

      if (options.immediate && !effectEntry.hasRun) {
        runEffect();
      } else {
        effectQueue.set(effectKey, () => {
          if (effectEntry.hasRun && effectEntry.cleanup) {
            effectEntry.cleanup();
          }
          runEffect();
        });
      }
    }

    effectEntryIdx++;
  };

  const store: TeenyStore<T> = {
    getState: () => currentState,
    
    setState: (newState: T): T => {
      currentState = newState;
      registerEffectsFn();
      return currentState;
    },

    trackEffects: (registerEffects: RegisterEffects) => {
      registerEffectsFn = () => {
        registerEffects(useEffect);
        effectEntryIdx = 0;

        effectPromise = Promise.resolve().then(() => {
          for (const effect of effectQueue.values()) {
            effect();
          }
          effectQueue.clear();
        });
      };
      
      registerEffectsFn();
    },

    effectExecution: () => effectPromise,
  };

  return store;
};