const listEl = document.getElementById("cart-list");
const emptyEl = document.getElementById("empty-cart");
const summaryEl = document.getElementById("cart-summary");
const totalEl = document.getElementById("cart-total-amount");
const noteEl = document.querySelector(".cart-note");
const formEl = document.getElementById("checkout-form");
const messageEl = document.getElementById("order-message");

let deliveryFee = 0;

injectStyles(".order-message.error { background: #f8d7da; color: #842029; }");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(text, isError) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
  messageEl.hidden = false;
}

function renderCart() {
  const cart = getCart();
  emptyEl.hidden = cart.length > 0;
  summaryEl.hidden = cart.length === 0;

  listEl.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <div class="item-info">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${formatMoney(item.price)} each</p>
        <a href="#" class="remove" data-action="remove" data-slug="${escapeHtml(item.slug)}">Remove</a>
      </div>
      <div class="quantity">
        <button type="button" data-action="decrease" data-slug="${escapeHtml(item.slug)}" aria-label="Decrease quantity">-</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" data-slug="${escapeHtml(item.slug)}" aria-label="Increase quantity">+</button>
      </div>
      <strong class="item-total">${formatMoney(item.price * item.quantity)}</strong>
    </article>`).join("");

  totalEl.textContent = formatMoney(cart.length ? cartSubtotal() + deliveryFee : 0);
  if (noteEl) {
    noteEl.textContent = deliveryFee > 0 ? `Includes delivery fee: ${formatMoney(deliveryFee)}` : "Delivery: free";
  }
}

listEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  event.preventDefault();
  const slug = target.dataset.slug;
  if (target.dataset.action === "increase") changeQuantity(slug, 1);
  if (target.dataset.action === "decrease") changeQuantity(slug, -1);
  if (target.dataset.action === "remove") removeItem(slug);
  renderCart();
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cart = getCart();
  if (cart.length === 0) {
    showMessage("Your cart is empty. Please add something first.", true);
    return;
  }
  const button = formEl.querySelector("button[type=submit]");
  const buttonText = button.textContent;
  button.disabled = true;
  button.textContent = "Placing order...";

  try {
    const result = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customer: {
          name: formEl.elements["name"].value,
          phone: formEl.elements["phone"].value,
          address: formEl.elements["address"].value,
          notes: formEl.elements["notes"].value,
        },
        items: cart.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      }),
    });

    clearCart();
    formEl.reset();
    renderCart();
    localStorage.setItem("frankis-last-order", result.orderNumber);
    showMessage(
      `Thank you! Your order number is ${result.orderNumber}. Total: ${formatMoney(result.total)}. ` +
      `Estimated delivery: about ${result.estimatedMinutes} minutes. Save your order number to track it on the Customer Service page.`,
      false
    );
  } catch (err) {
    showMessage(err.message, true);
  } finally {
    button.disabled = false;
    button.textContent = buttonText;
  }
});

renderCart();
api("/api/config")
  .then((config) => { deliveryFee = config.deliveryFee; renderCart(); })
  .catch(() => { });
