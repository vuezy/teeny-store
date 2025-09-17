import { createStore } from "@vuezy/teeny-store";

export function createCartStore() {
  const store = createStore([], {
    actions: {
      addProduct: (state, setState, product) => {
        const { cart, itemUpdated } = state.reduce((result, item) => {
          if (item.id === product.id) {
            result.cart.push({ ...item, quantity: item.quantity + 1 });
            result.itemUpdated = true;
          } else {
            result.cart.push(item);
          }
          return result;
        }, { cart: [], itemUpdated: false });

        if (!itemUpdated) {
          cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          });
        }
        setState(() => cart);
      },
      removeProduct: (state, setState, productId) => {
        const { cart, productRemoved } = state.reduce((result, item) => {
          if (item.id === productId) {
            if (item.quantity > 1) {
              result.cart.push({ ...item, quantity: item.quantity - 1 });
            }
            result.productRemoved = true;
          } else {
            result.cart.push(item);
          }
          return result;
        }, { cart: [], productRemoved: false });

        setState(() => cart);
        return productRemoved;
      },
    },
    persistence: {
      storage: 'localStorage',
      key: 'cart-system:cart',
    },
  });

  store.compute('itemCount', (state) => {
    return state.reduce((count, item) => count + item.quantity, 0);
  }, (state) => [state]);

  store.compute('totalPrice', (state) => {
    return state.reduce((total, item) => total + item.price * item.quantity, 0);
  }, (state) => [state]);

  return store;
};