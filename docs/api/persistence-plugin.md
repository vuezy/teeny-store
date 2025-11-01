# Persistence Plugin API

## createPersistencePlugin()
Create a Teeny Store plugin that enables state persistence.
```ts
function createPersistencePlugin<TState>(
  options?: {
    storage: 'localStorage' | 'sessionStorage';
    key: string;
    onLoaded?: (data: TState) => TState;
  },
): StorePluginFn<TState, PersistenceProps<TState> & Record<string, unknown>>
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |

**Parameters:**
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `options` | [`StorePersistenceOptions<TState>`](#storepersistenceoptions) | No | The initial persistence configuration. |

**Returns:** [`StorePluginFn<TState, PersistenceProps<TState> & Record<string, unknown>>`](./teeny-store#storepluginfn)  
The persistence plugin that adds extra properties/methods ([`PersistenceProps<TState>`](#persistenceprops)) to the store.


## PersistenceProps
Represents extra properties/methods added to the store when the persistence plugin is used.
```ts
interface PersistenceProps<TState> {
  persist: (options: ConfigurePersistenceOptions) => void;
  loadFromPersistence: (options: StorePersistenceOptions<TState>) => void;
  dropPersistence: () => void;
}
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |


### persist()
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
| `storage` | `'localStorage'\|'sessionStorage'` | The `Storage` to be used to persist the state. |
| `key` | `string` | The storage key name. |
| `clearPrev` | `boolean` | Whether to clear the previously used persistent storage.<br>Default: `false` |


### loadFromPersistence()
- Type: `(options: StorePersistenceOptions<TState>) => void`

Load data from a persistent storage to update the state.  

This method will also trigger side effects.  
[See available options](#storepersistenceoptions).


### dropPersistence()
- Type: `() => void`

Turn off persistence and clear stored state.


## StorePersistenceOptions
```ts
interface StorePersistenceOptions<TState> {
  storage: 'localStorage' | 'sessionStorage';
  key: string;
  onLoaded?: (data: TState) => TState;
}
```

**Type Parameters:**
| Parameter | Constraint | Default | Description |
| :--- | :--- | :--- | :--- |
| `TState` | - | - | The type of the state. |

**Properties:**
| Property | Type | Description |
| :--- | :--- | :--- |
| `storage` | `'localStorage'\|'sessionStorage'` | The `Storage` to be used to persist the state. |
| `key` | `string` | The storage key name. |
| `onLoaded` | `((data: TState) => TState)\|undefined` | The function to be run **after data is loaded** from the storage and **before it is used to update the state**. The return value will be the new state value. |