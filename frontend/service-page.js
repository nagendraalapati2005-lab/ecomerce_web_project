injectStyles(`
  .service-result { margin: 8px 0 0; padding: 10px 12px; border-radius: 10px; font-size: 14px; line-height: 1.5; }
  .service-result[hidden] { display: none; }
  .service-result.ok { background: #e6f0d6; color: #2d4a14; }
  .service-result.error { background: #f8d7da; color: #842029; }
  .service-result.info { background: #fff3cd; color: #664d03; }
`);

function show(element, text, kind) {
  element.textContent = text;
  element.className = "service-result " + kind;
  element.hidden = false;
}

const ORDER_NUMBER = /^FR-[A-HJ-NP-Z2-9]{8}$/;
function readOrderNumber(value) {
  const number = value.trim().toUpperCase();
  if (!number) throw new Error("Please enter your order number.");
  if (!ORDER_NUMBER.test(number)) throw new Error("That does not look like an order number. It looks like FR-ABCD2345.");
  return number;
}
function wireCard(selector, handler) {
  const group = document.querySelector(selector);
  if (!group) return;
  const input = group.querySelector("input");
  const button = group.querySelector("button");
  const result = document.createElement("p");
  result.hidden = true;
  group.appendChild(result);

  const last = localStorage.getItem("frankis-last-order");
  if (last && selector !== ".allergies_diets") input.value = last;

  button.addEventListener("click", async () => {
    button.disabled = true;
    show(result, "One moment...", "info");
    try {
      const outcome = await handler(input.value);   
      show(result, outcome.text, outcome.kind || "ok");
    } catch (err) {
      show(result, err.message, "error");
    }
    button.disabled = false;
  });
}

wireCard(".track_order", async (value) => {
  const number = readOrderNumber(value);
  const order = await api(`/api/orders/${encodeURIComponent(number)}`);
  const items = order.items.map((i) => `${i.quantity} x ${i.name}`).join(", ");
  const finished = order.status === "cancelled" || order.status === "delivered";
  const eta = finished ? "" : ` Estimated arrival: about ${order.minutesLeft} minutes.`;
  return { text: `Order ${order.orderNumber}: ${order.statusLabel}.${eta} Items: ${items}.` };
});

wireCard(".change_cancel", async (value) => {
  const number = readOrderNumber(value);
  const ok = confirm(`Cancel order ${number}? This cannot be undone.\n(To change items, cancel and place a new order, or call us.)`);
  if (!ok) return { text: "Okay, your order was not changed.", kind: "info" };
  const result = await api(`/api/orders/${encodeURIComponent(number)}/cancel`, { method: "POST" });
  return { text: result.message };
});

wireCard(".problem_order", async (value) => {
  const number = readOrderNumber(value);
  const result = await api("/api/support", {
    method: "POST",
    body: JSON.stringify({ topic: "Problem with my order", orderNumber: number, message: "Customer reported a problem with this order." }),
  });
  return { text: result.message + " We will look at order " + number + " right away." };
});

wireCard(".allergies_diets", async (value) => {
  const text = value.trim();
  if (!text) throw new Error("Please type your allergy or diet question.");
  const looksLikeOrder = ORDER_NUMBER.test(text.toUpperCase());
  await api("/api/support", {
    method: "POST",
    body: JSON.stringify({
      topic: "Allergy or diet question",
      orderNumber: looksLikeOrder ? text.toUpperCase() : "",
      message: looksLikeOrder ? "Allergy or diet question about this order." : text,
    }),
  });
  return { text: "Thank you. For your safety, please also call us before ordering. We cannot promise any item is free of allergens.", kind: "info" };
});

const supportForm = document.getElementById("support-form");
if (supportForm) {
  const formResult = document.createElement("p");
  formResult.hidden = true;
  supportForm.appendChild(formResult);

  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = supportForm.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const orderNumber = supportForm.elements["orderNumber"].value.trim().toUpperCase();
      const result = await api("/api/support", {
        method: "POST",
        body: JSON.stringify({
          name: supportForm.elements["name"].value,
          contact: supportForm.elements["contact"].value,
          topic: supportForm.elements["topic"].value,
          orderNumber,
          message: supportForm.elements["message"].value,
        }),
      });
      supportForm.reset();
      show(formResult, result.message, "ok");
    } catch (err) {
      show(formResult, err.message, "error");
    }
    button.disabled = false;
  });
}
