import { createCartStore } from "./cartStore";
import { createProductStore } from "./productStore";

/* @docs-strip-export */
export function init() {
  const productStore = createProductStore();
  const cartStore = createCartStore();

  productStore.useEffect(renderProducts, (state) => [state]);
  cartStore.useEffect(renderCart, (state) => [state]);
  cartStore.useEffect(renderCartItemCount, () => [cartStore.computed.itemCount]);
  cartStore.useEffect(renderCartTotalPrice, () => [cartStore.computed.totalPrice]);

  function renderProducts(products) {
    const productList = document.getElementById('products');
    if (productList) {
      productList.innerHTML = '';
      products.forEach((product) => {
        const productContainer = document.createElement('div');
        productContainer.className = 'product-container';
        productContainer.innerHTML = `
          <span>${product.name} - $${product.price}<br><small>${product.stock} item(s) available</small></span>
          <button>Add to cart</button>
        `;
        
        const addBtn = productContainer.querySelector('button');
        if (addBtn) {
          if (product.stock > 0) {
            addBtn.addEventListener('click', () => addToCart(product.id));
          } else {
            addBtn.className = 'disabled';
            addBtn.setAttribute('disabled', true);
          }
        }

        productList.appendChild(productContainer);
      });
    }
  }

  function renderCart(cart) {
    const cartEl = document.getElementById('cart');
    if (cartEl) {
      cartEl.innerHTML = '';
      cart.forEach((item) => {
        const cartItemContainer = document.createElement('div');
        cartItemContainer.className = 'cart-item-container';
        cartItemContainer.innerHTML = `
          <div>${item.name}<br><small>@ $${item.price}</small></div>
          <div>
            <div class="cart-item-total">$${item.price * item.quantity}</div>
            <div class="cart-item-quantity">
              <button class="decrement-btn">-</button>
              <span>${item.quantity}</span>
              <button class="increment-btn">+</button>
            </div>
          </div>
        `;

        const decrementBtn = cartItemContainer.querySelector('.decrement-btn');
        if (decrementBtn) {
          decrementBtn.addEventListener('click', () => removeFromCart(item.id));
        }
        const incrementBtn = cartItemContainer.querySelector('.increment-btn');
        if (incrementBtn) {
          incrementBtn.addEventListener('click', () => addToCart(item.id));
        }

        cartEl.appendChild(cartItemContainer);
      });
    }
  }

  function renderCartItemCount() {
    const itemCountEl = document.getElementById('cart-item-count');
    if (itemCountEl) {
      itemCountEl.textContent = cartStore.computed.itemCount;
    }
  }

  function renderCartTotalPrice() {
    const totalPriceEl = document.getElementById('cart-total-price');
    if (totalPriceEl) {
      totalPriceEl.textContent = cartStore.computed.totalPrice;
    }
  }

  function addToCart(productId) {
    const stockDecremented = productStore.actions.decrementStock(productId);
    if (stockDecremented) {
      cartStore.actions.addProduct(productStore.getState().find((product) => product.id === productId));
    }
  }

  function removeFromCart(productId) {
    const productRemoved = cartStore.actions.removeProduct(productId);
    if (productRemoved) {
      productStore.actions.incrementStock(productId);
    }
  }
};
/* @end-docs-strip-export */