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

/**
 * @template TComputed - The type of the computation result (computed value).
 */
export interface ComputeReturn<TComputed> {
  /**
   * The computation result.
   */
  computed?: TComputed;

  /**
   * The function to toggle the active state of the computation.
   */
  toggleActive: ToggleEffectActive;
};

/**
 * @template TComputed - The type of the object containing computed values.
 * @param name - A unique name for the computed value, which is used as a key in the {@link ComputationService.computed computed} property.
 * @param computation - The function that performs the computation. The return value is the computation result.
 * @param depsFn - The function that resolves the dependency values of the computation.
 * @param options - {@link ComputeOptions}.
 * @returns An object containing the computation result and a function to toggle the active state of the computation. See {@link ComputeReturn}.
 */
export type ComputeFn<TComputed extends Record<string, unknown>> = <K extends keyof TComputed>(
  name: K,
  computation: () => TComputed[K],
  depsFn: () => ComputedDeps,
  options?: ComputeOptions,
) => ComputeReturn<TComputed[K]>;

/**
 * @template TComputed - The type of the object containing computed values.
 */
export type ComputedValues<TComputed extends Record<string, unknown>> = Partial<{ [K in keyof TComputed]: TComputed[K] }>;

/**
 * @template TComputed - The type of the object containing computed values.
 */
export interface ComputationService<TComputed extends Record<string, unknown>> {
  /**
   * A collection of computed values (results from the {@link ComputationService.compute compute} method).
   */
  computed: ComputedValues<TComputed>;

  /**
   * Compute a value in response to dependency changes.
   */
  compute: ComputeFn<TComputed>;
};

/**
 * Create a service that encapsulates logic to compute a value in response to dependency changes.
 * @template TComputed - The type of the object containing computed values.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects. See {@link EffectProcessor}.
 * @returns A {@link ComputationService}.
 */
export function createComputationService<TComputed extends Record<string, unknown>>(effectProcessor: EffectProcessor): ComputationService<TComputed> {
  const computedProperties: ComputationService<TComputed>['computed'] = {};

  const recompute = <K extends keyof TComputed>(effectEntry: EffectEntry) => {
    (computedProperties as Record<K, unknown>)[effectEntry.key as K] = effectEntry.effect();
  };

  const compute: ComputeFn<TComputed> = (name, computation, depsFn, options) => {
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