# Computation Service API

## createComputationService()
Create a service that encapsulates logic to compute a value in response to dependency changes.  

It utilizes [`EffectProcessor`](./effect-processor#effectprocessor) under the hood.
```ts
function createComputationService(effectProcessor: EffectProcessor): ComputationService
```

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effectProcessor` | [`EffectProcessor`](./effect-processor#effectprocessor) | Yes | The processor that manages, tracks, and triggers effects. |

**Returns:** <span id="computationservice">`ComputationService`</span>
```ts
interface ComputationService {
  computed: Record<PropertyKey, unknown>;
  compute: ComputeFn;
}
```


### service.computed
- Type: `Record<PropertyKey, unknown>`

A collection of computed values (results from the [`compute`](#service-compute) method).


### service.compute()
- Type: `ComputeFn`

Compute a value in response to dependency changes.  

The computation in this context is a **side effect** that derives a value (typically) from the given dependencies and keeps track of the result. The computation result can be referred to as the **computed value** and is available in the [`computed`](#service-computed) property.  
The computation will only re-run when triggered and at least one of its dependencies changes.  

This method calls the [`trackEffect`](./effect-processor#processor-trackeffect) method of the processor.
```ts
type ComputeFn = (name: string, computation: () => unknown, depsFn: () => ComputedDeps, options?: ComputeOptions) => ComputeReturn;
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | A unique name for the computed value, which is used as a key in the [`computed`](#service-computed) property. |
| `computation` | `() => unknown` | Yes | The function that performs the computation. The return value is the computation result. |
| `depsFn` | [`() => ComputedDeps`](#computeddeps) | Yes | The function that resolves the dependency values of the computation. |
| `options` | [`ComputeOptions`](#computeoptions) | No | Options to configure the computation's execution behavior. |

**Returns:** <span id="computereturn">`ComputeReturn`</span>  
An object containing the computation result and a function to toggle the active state of the computation.
```ts
interface ComputeReturn {
  computed: unknown;
  toggleActive: () => void;
}
```
| Property | Type | Description |
| :--- | :--- | :--- |
| `computed` | `unknown` | The computation result. |
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