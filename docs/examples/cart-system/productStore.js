import { createPersistencePlugin, defineStore } from "@vuezy/teeny-store";

const products = [
  { id: 1, name: 'Laptop', price: 1200, stock: 10 },
  { id: 2, name: 'Headphones', price: 150, stock: 6 },
  { id: 3, name: 'Mouse', price: 50, stock: 30 },
  { id: 4, name: 'Keyboard', price: 80, stock: 5 },
  { id: 5, name: 'Smartphone', price: 900, stock: 50 },
  { id: 6, name: 'Monitor', price: 400, stock: 4 },
  { id: 7, name: 'External HDD', price: 200, stock: 5 },
  { id: 8, name: 'Webcam', price: 100, stock: 2 },
];

export function createProductStore() {
  const store = defineStore(products, {
    decrementStock: (state, setState, id) => {
      const { products, stockDecremented } = state.reduce((result, product) => {
        if (product.id === id && product.stock > 0) {
          result.products.push({ ...product, stock: product.stock - 1 });
          result.stockDecremented = true;
        } else {
          result.products.push(product);
        }
        return result;
      }, { products: [], stockDecremented: false });

      setState(() => products);
      return stockDecremented;
    },
    incrementStock: (state, setState, id) => {
      const products = state.map((product) => {
        return product.id === id ? { ...product, stock: product.stock + 1 } : product;
      });
      setState(() => products);
    },
  }).use(createPersistencePlugin({
    storage: 'localStorage',
    key: 'cart-system:products',
  })).create();

  return store;
};