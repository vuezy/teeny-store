export interface TeenyStore<T> {
  getState: () => T;
  setState: (newState: T) => T;
  trackEffects: (registerEffects: RegisterEffects) => void;
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

  const useEffect: UseEffect = (effect: EffectFn, deps?: unknown[], options?: UseEffectOptions) => {
    const effectKey = options?.key ?? effectEntryIdx;
    let shouldRunEffect = false;

    let effectEntry = effectEntries.get(effectKey);
    if (!effectEntry) {
      effectEntry = {
        effect: effect,
        deps: deps,
      };
      effectEntries.set(effectKey, effectEntry);
      
      shouldRunEffect = options?.immediate ?? false;
    } else if (!options?.once || (options?.once && !effectEntry.hasRun)) {
      if (effectEntry.hasRun && effectEntry.cleanup) {
        effectEntry.cleanup();
      }

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
      const cleanup = effect();
      if (cleanup) {
        effectEntry.cleanup = cleanup;
      }
      effectEntry.hasRun = true;
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
      };
      
      registerEffectsFn();
    },
  };

  return store;
};