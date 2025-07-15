import type { EnqueueFn } from "./queue";
import { useEffectProcessor, type EffectEntry, type EffectFn, type ToggleEffectActive } from "./useEffectProcessor";

export interface UseEffectOptions {
  immediate?: boolean;
  once?: boolean;
  sync?: boolean;
};
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

export interface UseEffectServiceOptions {
  enqueue?: EnqueueFn;
};

export function useEffectService(options?: UseEffectServiceOptions) {
  let effectIdx = 0;

  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.cleanup?.();
    const cleanup = effectEntry.effect();
    if (typeof cleanup === 'function') {
      effectEntry.cleanup = cleanup as () => unknown;
    }
    effectEntry.hasRun = true;
  };

  const { trackEffect, triggerEffects, toggleActive } = useEffectProcessor({ runEffect, enqueue: options?.enqueue });

  const useEffect: UseEffect = (effect, depsFn, options): ToggleEffectActive => {
    const effectEntry = trackEffect(effectIdx, effect, depsFn, options);
    effectIdx++;
    return () => toggleActive(effectEntry);
  };

  return {
    useEffect,
    triggerEffects,
  };
};

export type UseEffectSystemReturn = ReturnType<typeof useEffectService>;