import type { TaskQueue } from "./queue";

export type EffectFn = () => unknown;
export type ToggleEffectActive = () => void;

/**
 * Represents an effect and its state.
 */
export interface EffectEntry {
  /**
   * The unique key of the effect.
   */
  key: PropertyKey;

  /**
   * The effect function.
   */
  effect: EffectFn;

  /**
   * The current dependency values of the effect.
   */
  deps?: unknown[];

  /**
   * The function that re-evaluates the dependencies.
   * @returns The new dependency values.
   */
  depsFn?: () => unknown[];

  /**
   * The function that cleans up the previous effect run.
   */
  cleanup?: () => void;

  /**
   * The function to be run when the effect is triggered.
   */
  run: () => void;

  /**
   * Whether the effect is active.
   */
  active: boolean;

  /**
   * Whether the effect should be run synchronously.
   */
  sync: boolean;

  /**
   * Whether the effect should be run only once.
   */
  once: boolean;

  /**
   * Whether the effect has run.
   */
  hasRun: boolean;
};

export interface TrackEffectOptions {
  /**
   * The function to be run when the effect is triggered.
   * @param effectEntry - The effect data. See {@link EffectEntry}.
   */
  runner?: (effectEntry: EffectEntry) => void;

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
 * @param key - A unique key for the effect.
 * @param effect - A function that performs an effect.
 * @param depsFn - A function that re-evaluates the effect's dependencies.
 * @param options - See {@link TrackEffectOptions}.
 * @returns The effect data. See {@link EffectEntry}.
 */
export type TrackEffect = (key: PropertyKey, effect: EffectFn, depsFn?: () => unknown[], options?: TrackEffectOptions) => EffectEntry;

export interface CreateEffectProcessorParams {
  /**
   * A queue for processing effects.
   */
  queue: TaskQueue;
};

/**
 * Represents a processor that manages, tracks, and triggers effects.
 */
export interface EffectProcessor {
  /**
   * Track an effect.
   */
  trackEffect: TrackEffect;

  /**
   * Trigger all tracked effects.
   */
  triggerEffects: () => void;

  /**
   * Toggle the active state of an effect.
   * @param effectEntry - The effect data. See {@link EffectEntry}.
   */
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
      const attemptRunningEffect = () => {
        if (shouldRunEffect(effectEntry)) {
          runEffect(effectEntry);
        }
      };

      if (effectEntry.sync) {
        attemptRunningEffect();
      } else {
        queue.add(effectEntry.key, () => attemptRunningEffect());
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