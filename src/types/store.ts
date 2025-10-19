import type { EffectProcessor } from "../effectProcessor";
import type { TaskQueue } from "../queue";

/**
 * @template TState - The type of the state.
 * @param newState - The function that receives the current state value and returns a new state value.
 * @returns A new state value.
 */
export type SetState<TState> = (newState: (state: TState) => TState) => TState;

/**
 * Represents a plugin function to extend Teeny Store.
 * @template TState - The type of the state.
 * @template TExtProps - The type of the object containing custom properties/methods.
 * @param getState - The function to get the current state in the store.
 * @param effectProcessor - The processor that manages, tracks, and triggers effects.
 * @param queue - The queue used for processing scheduled effects.
 * @returns A Teeny Store plugin function.
 */
export type StorePluginFn<TState, TExtProp extends object = object> = (
  getState: () => TState,
  setState: SetState<TState>,
  effectProcessor: EffectProcessor,
  queue: TaskQueue,
) => TExtProp|void;