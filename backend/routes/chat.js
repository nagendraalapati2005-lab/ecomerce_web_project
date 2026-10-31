
import { Router } from "express";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db.js";
import { asyncHandler, STORE_PHONE } from "../utils.js";

const router = Router();
let client = null; 

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  message: { reply: "You are sending messages very fast. Please wait a moment." },
});

router.post("/", limiter, asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ reply: `The assistant is not available right now. Please call us at ${STORE_PHONE}.` });
  }
  client = client || new Anthropic(); 

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ reply: "Please type a message." });
  }

  const clean = messages.slice(-10).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content).slice(0, 500),
  }));
  while (clean.length && clean[0].role === "assistant") clean.shift();
  if (clean.length === 0) return res.status(400).json({ reply: "Please type a message." });

  const [menu] = await pool.query(
    "SELECT name, description, price, category FROM menu_items WHERE available = 1"
  );
  const minutes = Number(process.env.ESTIMATED_MINUTES || 40);

  const system = `You are the friendly assistant for Franki's Pizzeria.
Help customers choose food, answer menu questions, and explain how to order.

Facts:
- Hours: 8:00 AM - 10:00 PM, 7 days a week.
- Delivery: within about ${minutes} minutes of ordering.
- Phone: ${STORE_PHONE}.

Rules:
- Only use the menu below. Never invent items, prices or ingredients.
- If you do not know something, say so and suggest calling ${STORE_PHONE}.
- For allergy questions never promise that something is safe. Tell them to call the store.
- You cannot place orders or take payments. Tell customers to use the Menu and Cart pages.
- Keep answers short (2-4 sentences) and friendly.
- Politely refuse topics that are not about Franki's Pizzeria.

Menu (JSON): ${JSON.stringify(menu)}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 400,
      system,
      messages: clean,
    });
    const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    res.json({ reply });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.status(502).json({ reply: `Sorry, I am having trouble right now. Please call us at ${STORE_PHONE}.` });
  }
}));

export default router;