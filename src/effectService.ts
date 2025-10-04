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
 * @param effect - The function that performs the effect. If the return value is a function, it will be called before each effect re-run as the cleanup function.
 * @param depsFn - The function that resolves the effect's dependency values.
 * @param options - {@link UseEffectOptions}.
 * @returns A function to toggle the active state of the effect.
 */
export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => ToggleEffectActive;

export interface EffectService {
  /**
   * Perform an effect in response to dependency changes.
   */
  useEffect: UseEffect;
};

/**
 * Create a service that encapsulates logic to perform an effect in response to dependency changes.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects. See {@link EffectProcessor}.
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