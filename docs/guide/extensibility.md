# Extend the Store
Teeny Store is designed to be flexible and adaptable. You can extend Teeny Store to add custom behavior or tailor its functionality to your specific needs.

Teeny Store can be extended through plugins, which are simple functions that build on top of its core behavior. Plugins allow us to add new capabilities and behavior in a clean way.

The plugin function follows this [signature](/api/teeny-store#storepluginfn):
```js
const plugin = (getState, setState, effectProcessor, queue) => {
  // ...
  return {
    // ...
  };
};
```
| Parameter | Description |
| :--- | :--- |
| [`getState`](/api/teeny-store#store-getstate) | The function to get the current state in the store. |
| [`setState`](/api/teeny-store#store-setstate) | The function to update the state and trigger side effects. |
| [`effectProcessor`](/api/effect-processor#effectprocessor) | The processor used by the store to manage, track, and trigger effects. |
| [`queue`](/api/effect-processor#taskqueue) | The queue used by the store to process scheduled effects. |

The plugin function can **optionally** return an object containing custom properties/methods, which will be automatically merged into the store instance.

You can register the plugin to the store's definition like this.
```js
const builder = defineStore().use(plugin);
```
And then create the store instance using that [builder](/api/teeny-store#storebuilder).
```js
const store = builder.create();
```
The plugin function will then be called **on store initialization**.

For example, let's take a quick look at the [persistence plugin](/api/persistence-plugin).
```js
const persistencePlugin = (getState, setState, effectProcessor) => {
  // ...
  const configurePersistence = (options) => { /** ... */};
  const loadFromPersistence = (options) => { /** ... */};
  const removeStorage = () => { /** ... */};
  const initializePersistence = () => { /** ... */};
  initializePersistence();

  return {
    persist: configurePersistence,
    loadFromPersistence,
    dropPersistence: removeStorage,
  };
};
```
When we do:
```js
const store = defineStore().use(persistencePlugin).create();
```
The persistence plugin will get called with [`getState`](/api/teeny-store#store-getstate), [`setState`](/api/teeny-store#store-setstate), and [`effectProcessor`](/api/effect-processor#effectprocessor) provided by the store. The plugin then immediately runs the `initializePersistence` function to enable state persistence. The custom methods returned from the plugin are made available on the store instance.
<hr>

In addition to plugins, the [Teeny Store builder](/api/teeny-store#storebuilder) provides [`setEffectProcessor`](/api/teeny-store#builder-seteffectprocessor), [`setEffectService`](/api/teeny-store#builder-seteffectservice), and [`setComputationService`](/api/teeny-store#builder-setcomputationservice) methods that allow us to customize how side effects are managed and controlled.

For details on all available options and methods, see the [API Reference](/api/teeny-store).