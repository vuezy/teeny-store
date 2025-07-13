import type { TaskQueue } from "./queue";
import { useEffectProcessor, type EffectEntry, type ToggleEffectActive } from "./useEffectProcessor";

export type ComputedDeps = unknown[] & { 0: unknown };

export interface ComputeOptions {
  sync?: boolean;
};
export interface ComputeReturn {
  computed: unknown;
  toggleEffectActive: ToggleEffectActive;
};
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => ComputeReturn;

export interface UseComputedSystemParams {
  queue: TaskQueue;
};

export function useComputationService({ queue }: UseComputedSystemParams) {
  const computedProperties: Record<PropertyKey, unknown> = {};

  const recompute = (effectEntry: EffectEntry) => {
    computedProperties[effectEntry.key] = effectEntry.effect();
  };

  const { trackEffect, triggerEffects, toggleActive } = useEffectProcessor({ queue, onEffectRun: recompute });

  const compute: ComputeFn = (name, computation, depsFn, options): ComputeReturn => {
    const effectEntry = trackEffect(name, computation, depsFn, options);
    return {
      computed: computedProperties[name],
      toggleEffectActive: () => toggleActive(effectEntry),
    };
  };

  return {
    computed: computedProperties,
    compute,
    triggerRecomputation: triggerEffects,
  };
};

export type UseComputedSystemReturn = ReturnType<typeof useComputationService>;