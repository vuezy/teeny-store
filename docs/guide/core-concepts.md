<script setup>
import App from '@examples/calculator/App.vue';
</script>

# Core Concepts
Teeny Store brings clarity and control to application state and side effects, making your JavaScript/TypeScript code more predictable and easier to maintain.

Traditionally, in plain JavaScript/Typescript, state is scattered and side effects are freely executed, making the application's data flow unpredictable and difficult to trace. Teeny Store centralizes state and effects, creating a clear flow of data that is easier to control and reason about.

Let's build a very simple calculator app and see how we can use Teeny Store to help us.
<App />

In this app, the state includes the two operands, the operator, and the calculation result. We can create a Teeny Store to manage that state by using the `createStore` function.

<<< @/examples/calculator/snippets/1-store.js#createStore

To update the state, we can use the `setState` method like this.

<<< @/examples/calculator/snippets/1-store.js#setState

Or, we can also define some action functions that abstract the logic for updating the state in the store. In our calculator app, there are four actions that can modify the state.

<<< @/examples/calculator/snippets/2-action.js#action{8,11,14,17}

> [!NOTE]
> It is recommended that the state object is treated as **immutable**. Teeny Store relies on **shallow reference comparison** to detect changes and trigger side effects. So, instead of modifying the original state object, we should create a new object with the updated values.

Let's set up event listeners to call these actions.

<<< @/examples/calculator/snippets/2-action.js#listener

Next, we need to define the application's behavior in response to state changes. For example, when the `operator` state changes, the displayed operator must be updated and the `result` state must be recalculated. This is known as an **effect**, or more precisely, a **side effect**.

Here is the list of effects that react to state changes in our calculator.
- On `operand1` or `operand2` change: Update the value in the corresponding input field.
- On `operator` change: Update the displayed operator symbol.
- On `operand1`, `operand2`, or `operator` change: Recalculate the result.
- On `result` change: Display the new result.

Let's implement these effects using the `useEffect` method of the store and carefully specify the dependency arrays to control when they run.

<<< @/examples/calculator/snippets/3-effect.js#useEffect

We now no longer need to explicitly call the `calculate` action whenever the operand or the operator is updated. Having properly controlled effects makes our code more predictable.

> [!NOTE]
> When we call the `setState` method, effects will be triggered, but not necessarily executed. Teeny Store performs a **shallow comparison** on each dependency to determine whether an effect should re-run.  
> Effect execution is **batched** together with other state updates and by default **scheduled** to run after the call stack is empty. Also note that effects are executed in the order they are defined.

> [!TIP]
> The effect's dependency array can technically contain any value. However, most of the time, it's better to limit the dependency array to only include the state the effect depends on.

If you want, we can also use the `compute` method of the store to track the calculation result. The `compute` method is pretty similar to the `useEffect` method. It helps us compute a value (the calculation result) in response to dependency changes. The result will be available in the **computed property** of the store.

<<< @/examples/calculator/snippets/4-compute.js#compute

One last thing—let's persist the state to the `localStorage` so it survives a page reload.

<<< @/examples/calculator/snippets/5-persistence.js#persistence

The calculator app is now working as expected. Here is the full code.

<<< @/examples/calculator/index.js