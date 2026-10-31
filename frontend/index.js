const cart = new Map();
const cartCount = document.querySelector("#cart-count");
const cartToggle = document.querySelector(".cart-toggle");
const cartPanel = document.querySelector("#cart");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const clearCartButton = document.querySelector("#clear-cart");

function renderCart() {
  let itemCount = 0;
  let subtotal = 0;
  cartItems.replaceChildren();

  for (const item of cart.values()) {
    itemCount += item.quantity;
    subtotal += item.price * item.quantity;

    const listItem = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${item.name} × ${item.quantity}`;
    const price = document.createElement("span");
    price.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
    listItem.append(description, price);
    cartItems.append(listItem);
  }

  cartCount.textContent = String(itemCount);
  cartCount.setAttribute("aria-label", `${itemCount} ${itemCount === 1 ? "item" : "items"}`);
  cartTotal.textContent = `$${subtotal.toFixed(2)}`;
  cartEmpty.hidden = itemCount > 0;
  clearCartButton.disabled = itemCount === 0;
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const { id, name, price: rawPrice } = button.dataset;
    const price = Number(rawPrice);
    if (!id || !name || !Number.isFinite(price) || price <= 0) {
      return;
    }

    const item = cart.get(id);
    if (item) {
      item.quantity += 1;
    } else {
      cart.set(id, { name, price, quantity: 1 });
    }
    renderCart();
  });
});

cartToggle.addEventListener("click", () => {
  const isExpanded = cartToggle.getAttribute("aria-expanded") === "true";
  cartToggle.setAttribute("aria-expanded", String(!isExpanded));
  cartPanel.hidden = isExpanded;
  if (!isExpanded) {
    cartPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

clearCartButton.addEventListener("click", () => {
  cart.clear();
  renderCart();
});
