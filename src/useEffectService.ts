import type { TaskQueue } from "./queue";
import { useEffectProcessor, type EffectEntry, type EffectFn } from "./useEffectProcessor";

export interface UseEffectOptions {
  immediate?: boolean;
  once?: boolean;
  sync?: boolean;
};
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => void;

export interface UseEffectSystemParams {
  queue: TaskQueue;
};

export function useEffectService({ queue }: UseEffectSystemParams) {
  let effectIdx = 0;

  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.cleanup?.();
    const cleanup = effectEntry.effect();
    if (typeof cleanup === 'function') {
      effectEntry.cleanup = cleanup as () => unknown;
    }
    effectEntry.hasRun = true;
  };

  const { trackEffect, triggerEffects } = useEffectProcessor({ queue: queue, onEffectRun: runEffect });

  const useEffect: UseEffect = (effect, depsFn, options) => {
    trackEffect(effectIdx, effect, depsFn, options);
    effectIdx++;
  };

  return {
    useEffect,
    triggerEffects,
  };
};

export type UseEffectSystemReturn = ReturnType<typeof useEffectService>;