# Teeny Store API

## createStore()
Create a plain Teeny Store instance.

It is a shortcut for calling [`defineStore(state, actions).create()`](#definestore).
```ts
function createStore<
  TState,
  TActions extends ActionFnRecord<TState>,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
>(state: TState, actions?: TActions): TeenyStore<TState, TActions>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |
| `TActions` | [`ActionFnRecord<TState>`](#actionfnrecord) | - | The type of the action collection object. |
| `TComputed` | `Record<string, unknown>` | `Record<string, unknown>` | The type of the object containing computed values. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `TState` | Yes | The initial state in the store. |
| `actions` | `TActions` | No | The action collection object. The keys are action names and the values are action functions ([`ActionFn<TState>`](#actionfn)). |

**Returns:** <span id="teenystore">`TeenyStore<TState, TActions, TComputed>`</span>  
A Teeny Store instance.
```ts
interface TeenyStore<
  TState,
  TActions extends ActionFnRecord<TState>,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
> {
  getState: () => TState;
  computed: ComputedValues<TComputed>;
  setState: SetState<TState>;
  actions: StoreActions<TState, TActions>;
  useEffect: UseEffectWithState<TState>;
  compute: ComputeWithState<TState, TComputed>;
  nextTick: () => Promise<void>;
}
```
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |
| `TActions` | [`ActionFnRecord<TState>`](#actionfnrecord) | - | The type of the action collection object. |
| `TComputed` | `Record<string, unknown>` | `Record<string, unknown>` | The type of the object containing computed values. |


### store.getState()
- Type: `() => TState`

Get the current state.  

**Returns:** The current state.


### store.computed
- Type: `ComputedValues<TComputed>`

A collection of computed values (results from the [`compute`](#store-compute) method).
```ts
type ComputedValues<TComputed extends Record<string, unknown>>
  = Partial<{ [K in keyof TComputed]: TComputed[K] }>
```


### store.setState()
- Type: `SetState<TState>`

Update the state and trigger side effects.
```ts
type SetState<TState> = (
  newState: (state: TState) => TState,
  options?: {
    withoutSideEffect?: boolean;
  },
) => TState
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `newState` | `(state: TState) => TState` | Yes | The function that receives the current state value and returns a new state value. |
| `options.withoutSideEffect` | `boolean` | No | Whether to prevent side effects from being triggered after updating the state. |

**Returns:** A new state value.

> [!NOTE]
> It is recommended that the state object is treated as **immutable**. Teeny Store relies on **shallow reference comparison** to detect changes and execute side effects. So, instead of modifying the original state object, we should create a new object with the updated values.


### store.actions
- Type: `StoreActions<TState, TActions>`

A collection of action functions that abstract the logic for updating the state.  

It is a transformed interface where action functions ([`ActionFn`](#actionfn)) are converted to cleaner action functions that no longer expect the `state` and `setState` parameters.
```ts
type StoreActions<TState, TActions extends ActionFnRecord<TState>> = {
  [K in keyof TActions]: TActions[K] extends (
    state: TState,
    setState: SetState<TState>,
    ...args: infer Args,
  ) => TState | void
    ? (...args: Args) => TState | void
    : never;
}
```


### store.useEffect()
- Type : `UseEffectWithState<TState>`

Perform an effect in response to dependency changes.  

It is basically the same as the [`useEffect`](./effect-service#service-useeffect) method of an [`EffectService`](./effect-service#effectservice) instance, but it is **aware of the state** in the store.
Effects defined with this method will be triggered when the [`setState`](#store-setstate) method is called. When an effect is triggered, its **dependency values are checked and compared to their previous values to decide if the effect should execute**.  
For more details, check the [`service.useEffect()`](./effect-service#service-useeffect) reference section.
```ts
type UseEffectWithState<TState> = (
  effect: (state: TState) => unknown,
  depsFn?: (state: TState) => unknown[],
  options?: UseEffectOptions,
) => () => void
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effect` | `(state: TState) => unknown` | Yes | The function that performs the effect. It receives the current state as the argument. If the return value is a function, it will be called **before each effect re-run as the cleanup function**. |
| `depsFn` | `(state: TState) => unknown[]` | No | The function that resolves the effect's current dependency values. It receives the current state as the argument. |
| `options` | [`UseEffectOptions`](./effect-service#useeffectoptions) | No | Options to configure the effect's execution behavior. |

**Returns:** A function to toggle the active state of the effect.


### store.compute()
- Type : `ComputeWithState<TState, TComputed>`

Compute a value in response to dependency changes.  

The computation in this context is a **side effect** that derives a value (typically) from the given dependencies and keeps track of the result. The computation result can be referred to as the **computed value** and is available in the [`computed`](#store-computed) property.  

This method is basically the same as the [`compute`](./computation-service#service-compute) method of a [`ComputationService`](./computation-service#computationservice) instance, but it is **aware of the state** in the store.
Computation defined with this method will be triggered when the [`setState`](#store-setstate) method is called. When a computation is triggered, its **dependency values are checked and compared to their previous values to decide if it should execute**.  
For more details, check the [`service.compute()`](./computation-service#service-compute) reference section.
```ts
type ComputeWithState<
  TState,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
> = <K extends keyof TComputed>(
  name: K,
  computation: (state: TState) => TComputed[K],
  depsFn: (state: TState) => ComputedDeps,
  options?: ComputeOptions,
) => ComputeReturn<TComputed[K]>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `K` | Yes | A unique name for the computed value, which is used as a key in the [`computed`](#store-computed) property. |
| `computation` | `(state: TState) => TComputed[K]` | Yes | The function that performs the computation. It receives the current state as the argument. The return value is the computation result. |
| `depsFn` | [`(state: TState) => ComputedDeps`](./computation-service#computeddeps) | Yes | The function that resolves the dependency values of the computation. It receives the current state as the argument. |
| `options` | [`ComputeOptions`](./computation-service#computeoptions) | No | Options to configure the computation's execution behavior. |

**Returns:** [`ComputeReturn<TComputed[K]>`](./computation-service#computereturn)  
An object containing the computation result and a function to toggle the active state of the computation.


### store.nextTick()
- Type: `() => Promise<void>`

Wait until all side effects have been processed.  

**Returns:** A promise that resolves when all side effects have been processed.


## defineStore()
Define a Teeny Store using a builder to extend its behavior.
```ts
function defineStore<
  TState,
  TActions extends ActionFnRecord<TState>,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
  TExtProps extends object = object,
>(
  state: TState,
  actions?: TActions,
  options?: {
    plugins?: StorePluginFn<TState>[];
    effectProcessorCreator?: typeof createEffectProcessor;
    effectServiceCreator?: typeof createEffectService;
    computationServiceCreator?: typeof createComputationService<TComputed>;
  },
): StoreBuilder<TState, TActions, TComputed, TExtProps>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |
| `TActions` | [`ActionFnRecord<TState>`](#actionfnrecord) | - | The type of the action collection object. |
| `TComputed` | `Record<string, unknown>` | `Record<string, unknown>` | The type of the object containing computed values. |
| `TExtProps` | `object` | `object` | The type of the object containing custom properties/methods. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `TState` | Yes | The initial state in the store. |
| `actions` | `TActions` | No | The action collection object. The keys are action names and the values are action functions ([`ActionFn<TState>`](#actionfn)). |
| `options.plugins` | [`StorePluginFn<TState>[]`](#storepluginfn) | No | The collection of plugins to extend the store. |
| `options.effectProcessorCreator` | [`typeof createEffectProcessor`](./effect-processor#createeffectprocessor) | No | The function to customize the effect processor used by the store. |
| `options.effectServiceCreator` | [`typeof createEffectService`](./effect-service#createeffectservice) | No | The function to customize the effect service used by the store. |
| `options.computationServiceCreator` | [`typeof createComputationService`](./computation-service#createcomputationservice) | No | The function to customize the computation service used by the store. |

**Returns:** <span id="storebuilder">`StoreBuilder<TState, TActions, TComputed, TExtProps>`</span>  
A Teeny Store builder.
```ts
interface StoreBuilder<
  TState,
  TActions extends ActionFnRecord<TState>,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
  TExtProps extends object = object,
> {
  definePlugin: DefinePlugin<TState>;
  use: UsePlugin<TState, TActions, TComputed, TExtProps>;
  setEffectProcessor: SetEffectProcessor<TState, TActions, TComputed, TExtProps>;
  setEffectService: SetEffectService<TState, TActions, TComputed, TExtProps>;
  setComputationService: SetComputationService<TState, TActions, TComputed, TExtProps>;
  create: CreateFromBuilder<TState, TActions, TComputed, TExtProps>;
}
```


### builder.definePlugin()
- Type: `DefinePlugin<TState>`

Mark a function as a Teeny Store plugin for better type inference.
```ts
type DefinePlugin<TState> = <TExtProp extends object>(
  fn: StorePluginFn<TState, TExtProp>,
) => StorePluginFn<TState, TExtProp>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `fn` | [`StorePluginFn<TState, TExtProp>`](#storepluginfn) | Yes | The function to be marked as a plugin. |

**Returns:** The same function with better type information.


### builder.use()
- Type: `UsePlugin<TState, TActions, TComputed, TExtProps>`

Use a plugin to extend the store with custom behavior.
```ts
type UsePlugin<TState, TActions, TComputed, TExtProps>
  = <TExtProp extends object>(
    plugin: StorePluginFn<TState, TExtProp>,
  ) => StoreBuilder<TState, TActions, TComputed, TExtProps & TExtProp>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `plugin` | [`StorePluginFn<TState, TExtProp>`](#storepluginfn) | Yes | The plugin function. |

**Returns:** The [builder](#storebuilder) instance for method chaining.


### builder.setEffectProcessor()
- Type: `SetEffectProcessor<TState, TActions, TComputed, TExtProps>`

Customize the effect processor used by the store.
```ts
type SetEffectProcessor<TState, TActions, TComputed, TExtProps>
  = (
    creator: typeof createEffectProcessor,
  ) => StoreBuilder<TState, TActions, TComputed, TExtProps>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `creator` | [`typeof createEffectProcessor`](./effect-processor#createeffectprocessor) | Yes | The function to create the custom effect processor. |

**Returns:** The [builder](#storebuilder) instance for method chaining.


### builder.setEffectService()
- Type: `SetEffectService<TState, TActions, TComputed, TExtProps>`

Customize the effect service used by the store.
```ts
type SetEffectService<TState, TActions, TComputed, TExtProps>
  = (
    creator: typeof createEffectService,
  ) => StoreBuilder<TState, TActions, TComputed, TExtProps>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `creator` | [`typeof createEffectService`](./effect-service#createeffectservice) | Yes | The function to create the custom effect service. |

**Returns:** The [builder](#storebuilder) instance for method chaining.


### builder.setComputationService()
- Type: `SetComputationService<TState, TActions, TComputed, TExtProps>`

Customize the computation service used by the store.
```ts
type SetComputationService<TState, TActions, TComputed, TExtProps>
  = (
    creator: typeof createComputationService<TComputed>,
  ) => StoreBuilder<TState, TActions, TComputed, TExtProps>
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `creator` | [`typeof createComputationService<TComputed>`](./computation-service#createcomputationservice) | Yes | The function to create the custom computation service. |

**Returns:** The [builder](#storebuilder) instance for method chaining.


### builder.create()
- Type: `CreateFromBuilder<TState, TActions, TComputed, TExtProps>`

Create a [Teeny Store](#teenystore) instance.
```ts
type CreateFromBuilder<TState, TActions, TComputed, TExtProps>
  = () => keyof TExtProps extends never
    ? TeenyStore<TState, TActions, TComputed>
    : TeenyStoreWithExtProps<TState, TActions, TComputed, TExtProps>
```

**Returns:** A [Teeny Store](#teenystore) instance that includes custom properties, methods, and behaviors set by the builder's definition.


## ActionFnRecord
Represents an action collection object where the keys are action names and the values are action functions ([`ActionFn<TState>`](#actionfn)).
```ts
type ActionFnRecord<TState> = Record<string, ActionFn<TState>>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |


## ActionFn
```ts
type ActionFn<TState> = (
  state: TState,
  setState: SetState<TState>,
  ...args: any[],
) => TState | void
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `state` | `TState` | Yes | The current state value in the store. |
| `setState` | [`SetState<TState>`](#store-setstate) | Yes | The function to update the state. |
| `...args` | `any[]` | No | Additional data to be passed to the action function. |

**Returns:** A new state value or `void`.


## StorePluginFn
Represents a plugin function to extend Teeny Store.
```ts
type StorePluginFn<TState, TExtProp extends object = object> = (
  getState: () => TState,
  setState: SetState<TState>,
  effectProcessor: EffectProcessor,
  queue: TaskQueue,
) => TExtProp|void;
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |
| `TExtProps` | `object` | `object` | The type of the object containing custom properties/methods. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `getState` | `() => TState` | Yes | The function to get the current state in the store. |
| `setState` | [`SetState<TState>`](#store-setstate) | Yes | The function to update the state and trigger side effects. |
| `effectProcessor` | [`EffectProcessor`](./effect-processor#effectprocessor) | Yes | The processor used by the store to manage, track, and trigger effects. |
| `queue` | [`TaskQueue`](./effect-processor#taskqueue) | Yes | The queue used by the store to process scheduled effects. |

**Returns:** A Teeny Store plugin function.