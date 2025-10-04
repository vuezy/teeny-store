# Teeny Store API

## createStore()
Create a Teeny Store instance.
```ts
function createStore<T, U extends ActionFnRecord<T> = ActionFnRecord<T>>(
  state: T,
  options?: {
    actions?: U,
    persistence?: StorePersistenceOptions<T>,
  },
): TeenyStore<T, U>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `T` | - | - | The type of the state. |
| `U` | [`ActionFnRecord<T>`](#actionfnrecord) | [`ActionFnRecord<T>`](#actionfnrecord) | The type of the action collection object. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `T` | Yes | The initial state in the store. |
| `options` | `CreateStoreOptions<T, U>` | No | Additional options for the store. |
| `options.actions` | `U` | No | The action collection object. The keys are action names and the values are action functions ([`ActionFn<T>`](#actionfn)). |
| `options.persistence` | [`StorePersistenceOptions<T>`](#storepersistenceoptions) | No | The persistence options. Enabling persistence also sets up a **side effect** that saves the state to the storage whenever it changes. |

**Returns:** `TeenyStore<T, U>`  
A Teeny Store instance.
```ts
interface TeenyStore<T, U> {
  getState: () => T;
  computed: Record<PropertyKey, unknown>;
  setState: SetState<T>;
  actions: StoreActions<T, U>;
  useEffect: UseEffectWithState<T>;
  compute: ComputeWithState<T>;
  persist: (options: ConfigurePersistenceOptions) => void;
  loadFromPersistence: (options: StorePersistenceOptions<T>) => void;
  dropPersistence: () => void;
  nextTick: () => Promise<void>;
}
```
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `T` | - | - | The type of the state. |
| `U` | - | - | The type of the action collection object. |


### store.getState()
- Type: `() => T`

Get the current state.  

**Returns:** The current state.


### store.computed
- Type: `Record<PropertyKey, unknown>`

A collection of computed values (results from the [`compute`](#store-compute) method).


### store.setState()
- Type: `SetState<T>`

Update the state and trigger side effects.
```ts
type SetState<T> = (newState: (state: T) => T) => T
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `newState` | `(state: T) => T` | Yes | The function that receives the current state value and returns a new state value. |

**Returns:** A new state value.

> [!NOTE]
> It is recommended that the state object is treated as **immutable**. Teeny Store relies on **shallow reference comparison** to detect changes and execute side effects. So, instead of modifying the original state object, we should create a new object with the updated values.


### store.actions
- Type: `StoreActions<T, U>`

A collection of action functions that abstract the logic for updating the state.  

It is a transformed interface where action functions ([`ActionFn`](#actionfn)) are converted to cleaner action functions that no longer expect the `state` and `setState` parameters.
```ts
type StoreActions<T, U> = {
  [K in keyof U]: U[K] extends (state: T, setState: SetState<T>, ...args: infer Args) => T | void
    ? (...args: Args) => T | void
    : never;
}
```


### store.useEffect()
- Type : `UseEffectWithState<T>`

Perform an effect in response to dependency changes.  

It is basically the same as the [`useEffect`](./effect-service#service-useeffect) method of an [`EffectService`](./effect-service#effectservice) instance, but it is **aware of the state** in the store.
Effects defined with this method will be triggered when the [`setState`](#store-setstate) method is called. When an effect is triggered, its **dependency values are checked and compared to their previous values to decide if the effect should execute**.  
For more details, check the [`service.useEffect()`](./effect-service#service-useeffect) reference section.
```ts
type UseEffectWithState<T> = (effect: (state: T) => unknown, depsFn?: (state: T) => unknown[], options?: UseEffectOptions) => () => void
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effect` | `(state: T) => unknown` | Yes | The function that performs the effect. It receives the current state as the argument. If the return value is a function, it will be called **before each effect re-run as the cleanup function**. |
| `depsFn` | `(state: T) => unknown[]` | No | The function that resolves the effect's current dependency values. It receives the current state as the argument. |
| `options` | [`UseEffectOptions`](./effect-service#useeffectoptions) | No | Options to configure the effect's execution behavior. |

**Returns:** A function to toggle the active state of the effect.


### store.compute()
- Type : `ComputeWithState<T>`

Compute a value in response to dependency changes.  

The computation in this context is a **side effect** that derives a value (typically) from the given dependencies and keeps track of the result. The computation result can be referred to as the **computed value** and is available in the [`computed`](#store-computed) property.  

This method is basically the same as the [`compute`](./computation-service#service-compute) method of a [`ComputationService`](./computation-service#computationservice) instance, but it is **aware of the state** in the store.
Computation defined with this method will be triggered when the [`setState`](#store-setstate) method is called. When a computation is triggered, its **dependency values are checked and compared to their previous values to decide if it should execute**.  
For more details, check the [`service.compute()`](./computation-service#service-compute) reference section.
```ts
type ComputeWithState<T> = (name: string, computation: (state: T) => unknown, depsFn: (state: T) => ComputedDeps, options?: ComputeOptions) => ComputeReturn
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | A unique name for the computed value, which is used as a key in the [`computed`](#store-computed) property. |
| `computation` | `(state: T) => unknown` | Yes | The function that performs the computation. It receives the current state as the argument. The return value is the computation result. |
| `depsFn` | [`(state: T) => ComputedDeps`](./computation-service#computeddeps) | Yes | The function that resolves the dependency values of the computation. It receives the current state as the argument. |
| `options` | [`ComputeOptions`](./computation-service#computeoptions) | No | Options to configure the computation's execution behavior. |

**Returns:** [`ComputeReturn`](./computation-service#computereturn)  
An object containing the computation result and a function to toggle the active state of the computation.


### store.persist()
- Type : `(options: ConfigurePersistenceOptions) => void`

Set up or reconfigure state persistence.  

This method defines a **side effect** that persists the state to the configured storage on every change.
```ts
interface ConfigurePersistenceOptions {
  storage: 'localStorage' | 'sessionStorage';
  key: string;
  clearPrev?: boolean;
}
```
| Property | Type | Description |
| :--- | :--- | :--- |
| `storage` | `'localStorage' \| 'sessionStorage'` | The `Storage` to be used to persist the state. |
| `key` | `string` | The storage key name. |
| `clearPrev` | `boolean` | Whether to clear the previously used persistent storage. |


### store.loadFromPersistence()
- Type: `(options: StorePersistenceOptions<T>) => void`

Load data from a persistent storage to update the state.  

This method will also trigger side effects.  
[See available options](#storepersistenceoptions).


### store.dropPersistence()
- Type: `() => void`

Turn off persistence and clear stored state.


### store.nextTick()
- Type: `() => Promise<void>`

Wait until all side effects have been processed.  

**Returns:** A promise that resolves when all side effects have been processed.


## ActionFnRecord
Represents an action collection object where the keys are action names and the values are action functions ([`ActionFn<T>`](#actionfn)).
```ts
type ActionFnRecord<T> = Record<string, ActionFn<T>>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `T` | - | - | The type of the state. |


## ActionFn
```ts
type ActionFn<T> = (state: T, setState: SetState<T>, ...args: any[]) => T | void
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `T` | - | - | The type of the state. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `T` | Yes | The current state value in the store. |
| `setState` | [`SetState<T>`](#store-setstate) | Yes | The function to update the state. |
| `...args` | `any[]` | No | Additional data to be passed to the action function. |

**Returns:** A new state value or `void`.


## StorePersistenceOptions
```ts
interface StorePersistenceOptions<T> {
  storage: 'localStorage' | 'sessionStorage';
  key: string;
  onLoaded?: (data: T) => T;
}
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `T` | - | - | The type of the state. |

**Properties:**
| Property | Type | Description |
| :--- | :--- | :--- |
| `storage` | `'localStorage' \| 'sessionStorage'` | The `Storage` to be used to persist the state. |
| `key` | `string` | The storage key name. |
| `onLoaded` | `(data: T) => T` | The function to be run **after data is loaded** from the storage and **before it is used to update the state**. The return value will be the new state value. |