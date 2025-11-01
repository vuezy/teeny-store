# Effect Service API

## createEffectService()
Create a service that encapsulates logic to perform an effect in response to dependency changes.  

It utilizes [`EffectProcessor`](./effect-processor#effectprocessor) under the hood.
```ts
function createEffectService(effectProcessor: EffectProcessor): EffectService
```

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effectProcessor` | [`EffectProcessor`](./effect-processor#effectprocessor) | Yes | The processor that manages, tracks, and triggers effects. |

**Returns:** <span id="effectservice">`EffectService`</span>
```ts
interface EffectService {
  useEffect: UseEffect;
}
```

### service.useEffect()
- Type: `UseEffect`

Perform an effect in response to dependency changes.  

The effect's reactivity can be configured through its dependency specification:
- No array (`undefined`): The effect always runs when triggered.
- Empty array (`[]`): The effect runs only once.
- Array with values (`[a, b]`): The effect runs when triggered and any listed value changes.

This method calls the [`trackEffect`](./effect-processor#processor-trackeffect) method of the processor.
```ts
type UseEffect = (
  effect: () => unknown,
  depsFn?: () => unknown[],
  options?: UseEffectOptions,
) => () => void
```
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `effect` | `() => unknown` | Yes | The function that performs the effect. If the return value is a function, it will be called **before each effect re-run as the cleanup function**. |
| `depsFn` | `() => unknown[]` | No | The function that resolves the effect's dependency values. |
| `options` | [`UseEffectOptions`](#useeffectoptions) | No | Options to configure the effect's execution behavior. |

**Returns:** A function to toggle the active state of the effect.


#### UseEffectOptions
```ts
interface UseEffectOptions {
  immediate?: boolean;
  sync?: boolean;
  once?: boolean;
}
```
| Property | Type | Description |
| :--- | :--- | :--- |
| `immediate` | `boolean` | Whether to run the effect immediately on setup.<br>Default: `true` |
| `sync` | `boolean` | Whether to run the effect synchronously.<br>Default: `false` |
| `once` | `boolean` | Whether to run the effect only once.<br>Default: `false` |