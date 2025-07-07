import type { TaskQueue } from "./queue";
import { useEffectProcessor, type EffectEntry } from "./useEffectProcessor";

export type ComputedDeps = unknown[] & { 0: unknown };

export interface ComputeOptions {
  sync?: boolean;
};
export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => unknown;

export interface UseComputedSystemParams {
  queue: TaskQueue;
};

export function useComputationService({ queue }: UseComputedSystemParams) {
  const computedProperties: Record<PropertyKey, unknown> = {};

  const recompute = (effectEntry: EffectEntry) => {
    computedProperties[effectEntry.key] = effectEntry.effect();
  };

  const { trackEffect, triggerEffects } = useEffectProcessor({ queue: queue, onEffectRun: recompute });

  const compute: ComputeFn = (name, computation, depsFn, options): unknown => {
    trackEffect(name, computation, depsFn, options);
    return computedProperties[name];
  };

  return {
    computed: computedProperties,
    compute,
    triggerRecomputation: triggerEffects,
  };
};

export type UseComputedSystemReturn = ReturnType<typeof useComputationService>;