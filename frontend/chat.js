(function () {
  injectStyles(`
    #fp-chat-toggle { position: fixed; right: 24px; bottom: 24px; z-index: 1000; min-width: 64px; height: 64px; padding: 0 20px;
      border: 0; border-radius: 999px; background: #c0392b; color: #fff; font: bold 17px "Segoe UI", Arial, sans-serif;
      text-transform: none; cursor: pointer; box-shadow: 0 10px 24px rgba(0,0,0,.3); }
    #fp-chat-panel { position: fixed; right: 24px; bottom: 104px; z-index: 1000; width: min(360px, calc(100vw - 48px)); height: 480px;
      display: flex; flex-direction: column; background: #fff8e7; border-radius: 20px; overflow: hidden;
      box-shadow: 0 20px 48px rgba(0,0,0,.35); font-family: "Segoe UI", Arial, sans-serif; }
    #fp-chat-panel[hidden] { display: none; }
    .fp-chat-header { background: #111; color: #ffd166; padding: 16px 20px; font-weight: bold; font-size: 18px; }
    .fp-chat-header small { background: #ffd166; color: #111; font-size: 12px; padding: 3px 8px; border-radius: 999px; margin-left: 8px; }
    #fp-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .fp-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; line-height: 1.45; font-size: 15px; white-space: pre-wrap; }
    .fp-msg.bot { background: #fff; color: #222; align-self: flex-start; }
    .fp-msg.user { background: #c0392b; color: #fff; align-self: flex-end; }
    #fp-chat-form { display: flex; gap: 8px; padding: 12px; background: #fff; }
    #fp-chat-input { flex: 1; width: auto; padding: 11px 14px; border: 2px solid #e2d2b0; border-radius: 999px; font: inherit; font-size: 15px; }
    #fp-chat-send { padding: 0 18px; border: 0; border-radius: 999px; background: #111; color: #fff; font-weight: bold; text-transform: none; cursor: pointer; }
    #fp-chat-send:disabled { opacity: .5; }
  `);

  const toggle = document.createElement("button");
  toggle.id = "fp-chat-toggle";
  toggle.type = "button";
  toggle.textContent = "Ask us";
  toggle.setAttribute("aria-label", "Open the pizza assistant");

  const panel = document.createElement("div");
  panel.id = "fp-chat-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="fp-chat-header">Pizza Assistant <small>AI</small></div>
    <div id="fp-chat-messages"></div>
    <form id="fp-chat-form">
      <input id="fp-chat-input" type="text" maxlength="500" placeholder="Ask about our menu..." autocomplete="off">
      <button id="fp-chat-send" type="submit">Send</button>
    </form>`;
  document.body.append(toggle, panel);

  const messagesEl = panel.querySelector("#fp-chat-messages");
  const form = panel.querySelector("#fp-chat-form");
  const input = panel.querySelector("#fp-chat-input");
  const sendButton = panel.querySelector("#fp-chat-send");
  const history = []; 

  function addMessage(text, who) {
    const bubble = document.createElement("div");
    bubble.className = "fp-msg " + who;
    bubble.textContent = text;         
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  addMessage("Hi! I can help you pick a pizza. What are you in the mood for?", "bot");

  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.textContent = panel.hidden ? "Ask us" : "Close";
    if (!panel.hidden) input.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";
    sendButton.disabled = true;
    const typing = addMessage("Typing...", "bot");

    try {
      const data = await api("/api/chat", { method: "POST", body: JSON.stringify({ messages: history }) });
      typing.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      typing.textContent = err.message;
    }
    sendButton.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
})();