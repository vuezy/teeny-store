<script setup>
import { default as TaskManager } from '@examples/task-manager/App.vue';
import { default as CartSystem } from '@examples/cart-system/App.vue';
</script>

# Examples
These practical examples illustrate the main features of Teeny Store and are designed to help you learn how to use Teeny Store effectively.  
For details on all available options and methods, see the [API Reference](/reference).

## Task Manager
<TaskManager />
::: code-group
<<< @/examples/task-manager/index.js
<<< @/examples/task-manager/store.js
:::

## Cart System
<CartSystem />
::: code-group
<<< @/examples/cart-system/index.js
<<< @/examples/cart-system/productStore.js
<<< @/examples/cart-system/cartStore.js
:::