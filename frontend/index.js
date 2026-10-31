document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const { id: slug, name, price: rawPrice } = button.dataset;
    const price = Number(rawPrice);
    if (!slug || !name || !Number.isFinite(price) || price <= 0) {
      return;
    }

    const card = button.closest(".favorite1, .favorite2, .favorite3, .special_offer_price");
    const image = card?.querySelector("img")?.getAttribute("src") || "";
    const added = addToCart({ slug, name, price, image });
    if (!button.dataset.label) button.dataset.label = button.textContent.trim();
    button.textContent = added ? "Added!" : "Max 20";
    setTimeout(() => (button.textContent = button.dataset.label), 900);
  });
});
