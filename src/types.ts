export type EffectFn = (() => void | (() => void));

export type DefineEffects = (useEffect: UseEffect) => void;

export type UseEffect = (effect: EffectFn, deps?: unknown[], options?: UseEffectOptions) => void;

export interface UseEffectOptions {
  key?: PropertyKey;
  immediate?: boolean;
  once?: boolean;
};