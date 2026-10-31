const API_BASE =
  ["localhost", "127.0.0.1"].includes(location.hostname) && location.port !== "3001"
    ? "http://localhost:3001"
    : "";
async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = {};
  try { data = await response.json(); } catch { /* no JSON came back */ }
  if (!response.ok) throw new Error(data.error || data.reply || "Something went wrong. Please try again.");
  return data;
}
function injectStyles(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}

const CART_KEY = "frankis-cart-v2";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function addToCart(item) {                     
  const cart = getCart();
  const existing = cart.find((i) => i.slug === item.slug);
  if (existing) {
    if (existing.quantity >= 20) return false;
    existing.quantity += 1;
  }
  else cart.push({ ...item, quantity: 1 });
  saveCart(cart);
  return true;
}
function changeQuantity(slug, change) {        
  const cart = getCart();
  const item = cart.find((i) => i.slug === slug);
  if (!item) return;
  item.quantity = Math.min(20, item.quantity + change);
  saveCart(cart.filter((i) => i.quantity > 0));
}
function removeItem(slug) { saveCart(getCart().filter((i) => i.slug !== slug)); }
function clearCart() { saveCart([]); }
function cartCount() { return getCart().reduce((sum, i) => sum + i.quantity, 0); }
function cartSubtotal() { return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0); }
function formatMoney(number) { return "$" + Number(number).toFixed(2); }

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function parsePrice(text) {
  const match = String(text).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function readItemFromButton(button) {
  const special = button.closest(".special_offer_price");
  if (special) {
    const img = document.querySelector(".special_offer_image img");
    return {
      slug: "special-offer",
      name: "Today's special offer",
      price: parsePrice(special.querySelector("p").textContent),
      image: img ? img.getAttribute("src") : "",
    };
  }
  const card = button.closest(".price").parentElement;
  const name = card.querySelector(":scope > p").textContent.trim();
  const img = card.querySelector("img");
  return {
    slug: slugify(name),
    name,
    price: parsePrice(card.querySelector(".price p").textContent),
    image: img ? img.getAttribute("src") : "",
  };
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".price p:last-child, .special_offer_price p:last-child, .add-to-cart");
  if (!button) return;
  if (document.querySelector("#cart-count") && button.matches(".add-to-cart")) return;
  if (!button.dataset.label) button.dataset.label = button.textContent.trim();
  if (button.dataset.label.toLowerCase() !== "add to cart") return;

  addToCart(readItemFromButton(button));

  button.textContent = "Added!";
  setTimeout(() => (button.textContent = button.dataset.label), 900);
});

const PAGES = {
  home: "index.html",
  menu: "menu.html",
  about: "about.html",
  contact: "customer-serviece.html",
  "customer service": "customer-serviece.html",
  cart: "cart.html",
};
function updateCartCount() {
  const count = cartCount();
  document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = count));
  document.querySelectorAll(".nav p, .nav-links a").forEach((el) => {
    if (el.querySelector(".cart-count")) return;
    if (/^cart\b/i.test(el.textContent.trim())) el.textContent = count > 0 ? `Cart (${count})` : "Cart";
  });
}
function setupNav() {
  document.querySelectorAll(".nav p, .nav-links a").forEach((el) => {
    const label = el.textContent.trim().toLowerCase().replace(/\s*\(\d+\)$/, "");
    const page = PAGES[label];
    if (!page) return;
    if (el.tagName === "P") el.addEventListener("click", () => (location.href = page)); // <p> is not a link, so we make it one
    else if (el.getAttribute("href") === "#") el.setAttribute("href", page);
  });
  updateCartCount();
}
document.addEventListener("DOMContentLoaded", setupNav);
