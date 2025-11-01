# Computation Service API

## createComputationService()
Create a service that encapsulates logic to compute a value in response to dependency changes.  

It utilizes [`EffectProcessor`](./effect-processor#effectprocessor) under the hood.
```ts
function createComputationService<TComputed extends Record<string, unknown>>(
  effectProcessor: EffectProcessor,
): ComputationService<TComputed>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TComputed` | `Record<string, unknown>` | - | The type of the object containing computed values. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effectProcessor` | [`EffectProcessor`](./effect-processor#effectprocessor) | Yes | The processor that manages, tracks, and triggers effects. |

**Returns:** <span id="computationservice">`ComputationService<TComputed>`</span>
```ts
interface ComputationService<TComputed extends Record<string, unknown>> {
  computed: ComputedValues<TComputed>;
  compute: ComputeFn<TComputed>;
}
```
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TComputed` | `Record<string, unknown>` | - | The type of the object containing computed values. |


### service.computed
- Type: `ComputedValues<TComputed>`

A collection of computed values (results from the [`compute`](#service-compute) method).
```ts
type ComputedValues<TComputed extends Record<string, unknown>>
  = Partial<{ [K in keyof TComputed]: TComputed[K] }>
```


### service.compute()
- Type: `ComputeFn<TComputed>`

Compute a value in response to dependency changes.  

The computation in this context is a **side effect** that derives a value (typically) from the given dependencies and keeps track of the result. The computation result can be referred to as the **computed value** and is available in the [`computed`](#service-computed) property.  
The computation will only re-run when triggered and at least one of its dependencies changes.  

This method calls the [`trackEffect`](./effect-processor#processor-trackeffect) method of the processor.
```ts
type ComputeFn<TComputed extends Record<string, unknown>> = <K extends keyof TComputed>(
  name: K,
  computation: () => TComputed<K>,
  depsFn: () => ComputedDeps,
  options?: ComputeOptions,
) => ComputeReturn<TComputed<K>>;
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `K` | Yes | A unique name for the computed value, which is used as a key in the [`computed`](#service-computed) property. |
| `computation` | `() => TComputed<K>` | Yes | The function that performs the computation. The return value is the computation result. |
| `depsFn` | [`() => ComputedDeps`](#computeddeps) | Yes | The function that resolves the dependency values of the computation. |
| `options` | [`ComputeOptions`](#computeoptions) | No | Options to configure the computation's execution behavior. |

**Returns:** <span id="computereturn">`ComputeReturn<TComputed<K>>`</span>  
An object containing the computation result and a function to toggle the active state of the computation.
```ts
interface ComputeReturn<TComputed> {
  computed?: TComputed;
  toggleActive: () => void;
}
```
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TComputed` | - | - | The type of the computation result (computed value). |

| Property | Type | Description |
| :--- | :--- | :--- |
| `computed` | `TComputed\|undefined` | The computation result. |
| `toggleActive` | `() => void` | The function to toggle the active state of the computation. |


#### ComputeOptions
```ts
interface ComputeOptions {
  sync?: boolean;
}
```
| Property | Type | Description |
| :--- | :--- | :--- |
| `sync` | `boolean` | Whether to run the computation synchronously.<br>Default: `false` |


## ComputedDeps
Represents a dependency array of a computation that hints that it should have at least one element.
```ts
type ComputedDeps = unknown[] & { 0: unknown }
```