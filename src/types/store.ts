import type { EffectProcessor } from "../effectProcessor";
import type { TaskQueue } from "../queue";

/**
 * @template TState - The type of the state.
 * @param newState - The function that receives the current state value and returns a new state value.
 * @returns A new state value.
 */
export type SetState<TState> = (newState: (state: TState) => TState, options?: SetStateOptions) => TState;

export interface SetStateOptions {
  /**
   * Whether to prevent side effects from being triggered after updating the state.
   */
  withoutSideEffect?: boolean;
};

/**
 * Represents a plugin function to extend Teeny Store.
 * @template TState - The type of the state.
 * @template TExtProps - The type of the object containing custom properties/methods.
 * @param getState - The function to get the current state in the store.
 * @param setState - The function to update the state and trigger side effects.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects.
 * @param queue - The queue used for processing scheduled effects.
 * @returns An object containing custom properties/methods or `void`.
 */
export type StorePluginFn<TState, TExtProps extends Record<string, unknown> = Record<string, unknown>> = (
  getState: () => TState,
  setState: SetState<TState>,
  effectProcessor: EffectProcessor,
  queue: TaskQueue,
) => TExtProps|void;