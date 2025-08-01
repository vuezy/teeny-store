import type { EffectEntry, EffectFn, ToggleEffectActive, EffectProcessor } from "./effectProcessor";

export interface UseEffectOptions {
  /**
   * Whether to run the effect immediately.
   */
  immediate?: boolean;

  /**
   * Whether to run the effect synchronously.
   */
  sync?: boolean;

  /**
   * Whether to run the effect only once.
   */
  once?: boolean;
};

/**
 * @param effect - A function that performs an effect.
 * @param depsFn - A function that re-evaluates the effect's dependencies.
 * @param options - See {@link UseEffectOptions}.
 * @returns A function to toggle the active state of the effect.
 */
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

export interface EffectService {
  /**
   * Track an effect.
   */
  useEffect: UseEffect;
};

/**
 * Create a service that helps in performing effects.
 * @param effectProcessor - See {@link EffectProcessor}.
 * @returns An {@link EffectService}.
 */
export function createEffectService(effectProcessor: EffectProcessor): EffectService {
  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.cleanup?.();
    const cleanup = effectEntry.effect();
    if (typeof cleanup === 'function') {
      effectEntry.cleanup = cleanup as () => void;
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