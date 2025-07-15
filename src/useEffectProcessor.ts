import type { EnqueueFn } from "./queue";

export type EffectFn = () => unknown;
export type ToggleEffectActive = () => void;

export interface EffectEntry {
  key: PropertyKey;
  effect: EffectFn;
  deps?: unknown[];
  depsFn?: () => unknown[];
  cleanup?: () => unknown;
  active: boolean;
  sync: boolean;
  once: boolean;
  hasRun: boolean;
};

export interface TrackEffectOptions {
  immediate?: boolean;
  once?: boolean;
  sync?: boolean;
};
export type TrackEffect = (key: PropertyKey, effect: EffectFn, depsFn?: () => unknown[], options?: TrackEffectOptions) => EffectEntry;

export interface UseEffectProcessorParams {
  runEffect: (effectEntry: EffectEntry) => void;
  enqueue?: EnqueueFn;
};

export function useEffectProcessor({ runEffect, enqueue }: UseEffectProcessorParams) {
  const effectEntries: EffectEntry[] = [];

  const withDefaultTrackEffectOptions = (options?: TrackEffectOptions): Required<TrackEffectOptions> => {
    return {
      immediate: options?.immediate === undefined ? true : options.immediate,
      once: options?.once === undefined ? false : options.once,
      sync: options?.sync === undefined ? false : options.sync,
    };
  };

  const trackEffect: TrackEffect = (key, effect, depsFn, options): EffectEntry => {
    const resolvedOptions = withDefaultTrackEffectOptions(options);

    const effectEntry: EffectEntry = {
      key: key,
      effect: effect,
      deps: depsFn?.(),
      depsFn: depsFn,
      hasRun: false,
      active: true,
      once: resolvedOptions.once,
      sync: resolvedOptions.sync,
    };

    if (resolvedOptions.immediate) {
      runEffect(effectEntry);
    }
    effectEntries.push(effectEntry);

    return effectEntry;
  };

  const triggerEffects = () => {
    for (let idx = 0; idx < effectEntries.length; idx++) {
      const effectEntry = effectEntries[idx];
      if (shouldRunEffect(effectEntry)) {
        if (effectEntry.sync) {
          runEffect(effectEntry);
        } else if (enqueue) {
          enqueue(effectEntry.key, () => runEffect(effectEntry));
        }
      }
    }
  };

  const shouldRunEffect = (effectEntry: EffectEntry): boolean => {
    if (!effectEntry.active) return false;
    if (effectEntry.once && effectEntry.hasRun) return false;
    
    const oldDepValues = effectEntry.deps;
    if (oldDepValues === undefined) return true;
    if (oldDepValues.length === 0) return !effectEntry.hasRun;

    effectEntry.deps = effectEntry.depsFn?.();
    return effectEntry.deps === undefined || effectEntry.deps.some((newDep, idx) => newDep !== oldDepValues[idx]);
  };

  const toggleActive = (effectEntry: EffectEntry) => {
    effectEntry.active = !effectEntry.active;
  };

  return {
    trackEffect,
    triggerEffects,
    toggleActive,
  };
};

export type UseEffectProcessorReturn = ReturnType<typeof useEffectProcessor>;