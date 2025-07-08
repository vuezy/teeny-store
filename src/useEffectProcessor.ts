import type { TaskQueue } from "./queue";

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
  queue: TaskQueue;
  onEffectRun: (effectEntry: EffectEntry) => void;
};

export function useEffectProcessor({ queue, onEffectRun }: UseEffectProcessorParams) {
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
      onEffectRun(effectEntry);
    }
    effectEntries.push(effectEntry);

    return effectEntry;
  };

  const triggerEffects = () => {
    for (let idx = 0; idx < effectEntries.length; idx++) {
      const effectEntry = effectEntries[idx];
      if (!effectEntry.active) continue;

      let shouldRunEffect = false;
      if (!effectEntry.once || (effectEntry.once && !effectEntry.hasRun)) {
        const newDepValues = effectEntry.depsFn?.();

        if (newDepValues === undefined) {
          shouldRunEffect = true;
        } else if (effectEntry.deps === undefined) {
          shouldRunEffect = true;
        } else if (effectEntry.deps.length === 0) {
          shouldRunEffect = !effectEntry.hasRun;
        } else {
          shouldRunEffect = effectEntry.deps.some((prevDep, idx) => newDepValues[idx] !== prevDep);
        }

        if (shouldRunEffect) {
          effectEntry.deps = newDepValues;
          if (effectEntry.sync) {
            onEffectRun(effectEntry);
          } else {
            queue.add(effectEntry.key, () => onEffectRun(effectEntry));
          }
        }
      }
    }
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