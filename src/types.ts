export type ComputeFn = (name: string, computation: () => unknown, depsFn: () => unknown[]) => unknown;

export type EffectFn = (() => void | (() => void));

export type UseEffect = (effect: EffectFn, depsFn?: () => unknown[], options?: UseEffectOptions) => void;

export interface UseEffectOptions {
  immediate?: boolean;
  once?: boolean;
};