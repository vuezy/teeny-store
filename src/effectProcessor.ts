import type { TaskQueue } from "./queue";

export type EffectFn = () => unknown;
export type ToggleEffectActive = () => void;

export interface EffectEntry {
  key: PropertyKey;
  effect: EffectFn;
  deps?: unknown[];
  depsFn?: () => unknown[];
  cleanup?: () => unknown;
  run: () => void;
  active: boolean;
  sync: boolean;
  once: boolean;
  hasRun: boolean;
};

export interface TrackEffectOptions {
  runner?: (effectEntry: EffectEntry) => void;
  immediate?: boolean;
  sync?: boolean;
  once?: boolean;
};
export type TrackEffect = (key: PropertyKey, effect: EffectFn, depsFn?: () => unknown[], options?: TrackEffectOptions) => EffectEntry;

export interface CreateEffectProcessorParams {
  queue: TaskQueue;
};

export interface EffectProcessor {
  trackEffect: TrackEffect;
  triggerEffects: () => void;
  toggleActive: (effectEntry: EffectEntry) => void;
};

export function createEffectProcessor({ queue }: CreateEffectProcessorParams): EffectProcessor {
  const effectEntries: EffectEntry[] = [];

  const withDefaultTrackEffectOptions = (options?: TrackEffectOptions): Required<TrackEffectOptions> => {
    return {
      runner: options?.runner === undefined ? () => {} : options.runner,
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
      run: () => resolvedOptions.runner(effectEntry),
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
        } else {
          queue.add(effectEntry.key, () => runEffect(effectEntry));
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

  const runEffect = (effectEntry: EffectEntry) => {
    effectEntry.run();
    effectEntry.hasRun = true;
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