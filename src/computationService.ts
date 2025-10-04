import type { EffectEntry, ToggleEffectActive, EffectProcessor } from "./effectProcessor";

/**
 * Represents a dependency array of a computation that hints that it should have at least one element.
 */
export type ComputedDeps = unknown[] & { 0: unknown };

export interface ComputeOptions {
  /**
   * Whether to run the computation synchronously.
   */
  sync?: boolean;
};

export interface ComputeReturn {
  /**
   * The computation result.
   */
  computed: unknown;

  /**
   * The function to toggle the active state of the computation.
   */
  toggleActive: ToggleEffectActive;
};

/**
 * @param name - A unique name for the computed value, which is used as a key in the {@link ComputationService.computed computed} property.
 * @param computation - The function that performs the computation. The return value is the computation result.
 * @param depsFn - The function that resolves the dependency values of the computation.
 * @param options - {@link ComputeOptions}.
 * @returns An object containing the computation result and a function to toggle the active state of the computation. See {@link ComputeReturn}.
 */
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

export interface ComputationService {
  /**
   * A collection of computed values (results from the {@link ComputationService.compute compute} method).
   */
  computed: Record<PropertyKey, unknown>;

  /**
   * Compute a value in response to dependency changes.
   */
  compute: ComputeFn;
};

/**
 * Create a service that encapsulates logic to compute a value in response to dependency changes.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects. See {@link EffectProcessor}.
 * @returns A {@link ComputationService}.
 */
export function createComputationService(effectProcessor: EffectProcessor): ComputationService {
  const computedProperties: Record<PropertyKey, unknown> = {};

  const recompute = (effectEntry: EffectEntry) => {
    computedProperties[effectEntry.key] = effectEntry.effect();
  };

  const compute: ComputeFn = (name, computation, depsFn, options): ComputeReturn => {
    const effectEntry = effectProcessor.trackEffect(name, computation, depsFn, { ...options, runner: recompute });
    return {
      computed: computedProperties[name],
      toggleActive: () => effectProcessor.toggleActive(effectEntry),
    };
  };

  return {
    computed: computedProperties,
    compute,
  };
};