import type { EffectEntry, ToggleEffectActive, EffectProcessor } from "./effectProcessor";

export type ComputedDeps = unknown[] & { 0: unknown };

export interface ComputeOptions {
  sync?: boolean;
};
export interface ComputeReturn {
  computed: unknown;
  toggleEffectActive: ToggleEffectActive;
};
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

export function useComputationService(effectProcessor: EffectProcessor) {
  const computedProperties: Record<PropertyKey, unknown> = {};

  const recompute = (effectEntry: EffectEntry) => {
    computedProperties[effectEntry.key] = effectEntry.effect();
  };

  const compute: ComputeFn = (name, computation, depsFn, options): ComputeReturn => {
    const effectEntry = effectProcessor.trackEffect(name, computation, depsFn, { ...options, runner: recompute });
    return {
      computed: computedProperties[name],
      toggleEffectActive: () => effectProcessor.toggleActive(effectEntry),
    };
  };

  return {
    computed: computedProperties,
    compute,
  };
};

export type UseComputationServiceReturn = ReturnType<typeof useComputationService>;