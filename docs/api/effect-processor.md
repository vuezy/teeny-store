# Effect Processor API

## createEffectProcessor()
Create a processor that manages, tracks, and triggers effects.  

An effect is an action that executes in reaction to dependency changes. However, for the effect to know about the changes, it **must first be triggered** via the [`triggerEffects`](#processor-triggereffects) method. After the effect is triggered, the processor performs **shallow comparison** on the dependency to determine if the effect should execute. Effects are executed **in the order they are defined**.  

The processor **immediately** executes an effect when it is first registered via the [`trackEffect`](#processor-trackeffect) method. On top of that, the processor also by default **batches** and **schedules** effect execution to run after the call stack is empty. This behavior can be modified in the [`options`](#trackeffectoptions) parameter of the [`trackEffect`](#processor-trackeffect) method.
```ts
function createEffectProcessor(
  params: {
    queue: TaskQueue,
  },
): EffectProcessor
```

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `params.queue` | [`TaskQueue`](#taskqueue) | Yes | The queue used for processing scheduled effects. |

**Returns:** <span id="effectprocessor">`EffectProcessor`</span>
```ts
interface EffectProcessor {
  trackEffect: TrackEffect;
  triggerEffects: () => void;
  toggleActive: (effectEntry: EffectEntry) => void;
}
```


### processor.trackEffect()
- Type: `TrackEffect`

Define and track an effect.  

The effect's reactivity can be configured through its dependency specification:
- No array (`undefined`): The effect always runs when triggered.
- Empty array (`[]`): The effect runs only once.
- Array with values (`[a, b]`): The effect runs when triggered and any listed value changes.
```ts
type TrackEffect = (key: PropertyKey, effect: () => unknown, depsFn?: () => unknown[], options?: TrackEffectOptions) => EffectEntry
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `key` | `PropertyKey` | Yes | A unique key for the effect. |
| `effect` | `() => unknown` | Yes | The function that performs the effect. |
| `depsFn` | `() => unknown[]` | No | The function that resolves the effect's dependency values. |
| `options` | [`TrackEffectOptions`](#trackeffectoptions) | No | Options to configure the effect's execution behavior. |

**Returns:** [`EffectEntry`](#effectentry)  
An object describing the registered effect.


#### TrackEffectOptions
```ts
interface TrackEffectOptions {
  runner?: (effectEntry: EffectEntry) => void;
  immediate?: boolean;
  sync?: boolean;
  once?: boolean;
}
```
| Property | Type | Description |
| :--- | :--- | :--- |
| `runner` | `(effectEntry: EffectEntry) => void` | The function that defines how the registered effect function should be run. It is the function that is actually run (**instead of the effect function**) when dependency changes are detected. It may be used to **add extra behavior around effect execution**.<br>Default: `() => {}` |
| `immediate` | `boolean` | Whether to run the effect immediately on setup.<br>Default: `true` |
| `sync` | `boolean` | Whether to run the effect synchronously.<br>Default: `false` |
| `once` | `boolean` | Whether to run the effect only once.<br>Default: `false` |


### processor.triggerEffects()
- Type: `() => void`

Trigger all tracked effects.  

When an effect is triggered, the processor performs **shallow comparison**, executing the effect only if dependency changes are detected.


### processor.toggleActive()
- Type: `(effectEntry: EffectEntry) => void`

Toggle the active state of an effect.
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effectEntry` | [`EffectEntry`](#effectentry) | Yes | An object containing the effect along with its data. |


## EffectEntry
Represents a registered effect, containing the data needed to define, track, and execute it.
```ts
interface EffectEntry {
  key: PropertyKey;
  effect: () => unknown;
  deps?: unknown[];
  depsFn?: () => unknown[];
  cleanup?: () => void;
  run: () => void;
  active: boolean;
  sync: boolean;
  once: boolean;
  hasRun: boolean;
}
```

**Properties:**
| Property | Type | Description |
| :--- | :--- | :--- |
| `key` | `PropertyKey` | The unique key for the effect. |
| `effect` | `() => unknown` | The effect function. |
| `deps` | `unknown[]` | The current dependency values. |
| `depsFn` | `() => unknown[]` | The function to resolve the dependency values. |
| `cleanup` | `() => void` | The function to clean up the previous effect run. |
| `run` | `() => void` | The function that defines how the effect function should be run. It may contain **extra behavior around effect execution**. |
| `active` | `boolean` | Whether the effect is active. |
| `sync` | `boolean` | Whether the effect should run synchronously. |
| `once` | `boolean` | Whether the effect should run only once. |
| `hasRun` | `boolean` | Whether the effect has run.|


## TaskQueue
Represents a queue for processing tasks.
```ts
interface TaskQueue {
  size: () => number;
  add: (key: PropertyKey, task: () => void) => void;
  flush: () => Promise<void>;
}
```

**Properties:**
| Property | Type | Description |
| :--- | :--- | :--- |
| `size` | `() => number` | Get the size of the queue. |
| `add` | `(key: PropertyKey, task: () => void) => void` | Add a task to the queue. |
| `flush` | `() => Promise<void>` | Process all tasks in the queue and clear it. |