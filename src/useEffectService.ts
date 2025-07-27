import type { EffectEntry, EffectFn, ToggleEffectActive, EffectProcessor } from "./effectProcessor";

export interface UseEffectOptions {
  immediate?: boolean;
  sync?: boolean;
  once?: boolean;
};
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

export function useEffectService(effectProcessor: EffectProcessor) {
  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.cleanup?.();
    const cleanup = effectEntry.effect();
    if (typeof cleanup === 'function') {
      effectEntry.cleanup = cleanup as () => unknown;
    }
  };

  const useEffect: UseEffect = (effect, depsFn, options): ToggleEffectActive => {
    const effectEntry = effectProcessor.trackEffect(Symbol('effect'), effect, depsFn, { ...options, runner: runEffect });
    return () => effectProcessor.toggleActive(effectEntry);
  };

  return {
    useEffect,
  };
};

export type UseEffectServiceReturn = ReturnType<typeof useEffectService>;