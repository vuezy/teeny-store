import type { EffectEntry, ToggleEffectActive, EffectProcessor } from "./effectProcessor";

export type ComputedDeps = unknown[] & { 0: unknown };

export interface ComputeOptions {
  /**
   * Whether to run the computation synchronously.
   */
  sync?: boolean;
};
export interface ComputeReturn {
  /**
   * The computed property.
   */
  computed: unknown;

  /**
   * Toggle the active state of the computation.
   */
  toggleActive: ToggleEffectActive;
};

/**
 * @param name - A unique name for the computed property.
 * @param computation - A function that performs a computation.
 * @param depsFn - A function that re-evaluates the computation's dependencies.
 * @param options - See {@link ComputeOptions}.
 * @returns See {@link ComputeReturn}.
 */
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

export interface ComputationService {
  /**
   * The computed properties.
   */
  computed: Record<PropertyKey, unknown>;

  /**
   * Track a computation and its result (computed property).
   */
  compute: ComputeFn;
};

/**
 * Create a service that helps in managing computed properties.
 * @param effectProcessor - See {@link EffectProcessor}.
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