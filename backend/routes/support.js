import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { asyncHandler, isOrderNumber } from "../utils.js";

const router = Router();
const TOPICS = [
  "Problem with my order",
  "Change or cancel an order",
  "Allergy or diet question",
  "Feedback",
  "Something else",
];

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  message: { error: "Too many messages. Please wait a minute and try again." },
});

router.post("/", limiter, asyncHandler(async (req, res) => {
  const topic = String(req.body.topic || "Something else");
  const name = String(req.body.name || "").trim().slice(0, 80);
  const contact = String(req.body.contact || "").trim().slice(0, 120);
  const message = String(req.body.message || "").trim();
  const orderNumber = String(req.body.orderNumber || "").trim().toUpperCase();

  if (!TOPICS.includes(topic)) return res.status(400).json({ error: "Please choose a topic from the list." });
  if (message.length > 1000) return res.status(400).json({ error: "Your message is too long (1000 letters max)." });
  if (orderNumber && !isOrderNumber(orderNumber)) {
    return res.status(400).json({ error: "That order number does not look right. It looks like FR-ABCD2345." });
  }
  if (!message && !orderNumber) return res.status(400).json({ error: "Please write a message or enter your order number." });

  await pool.query(
    "INSERT INTO support_messages (topic, name, contact, order_number, message) VALUES (?, ?, ?, ?, ?)",
    [topic, name || null, contact || null, orderNumber || null, message || null]
  );
  res.status(201).json({ message: "Thank you! We received your message and will get back to you soon." });
}));

export default router;