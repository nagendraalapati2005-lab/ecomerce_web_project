
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { asyncHandler, makeOrderNumber, isOrderNumber, STATUS_LABELS, round2, STORE_PHONE } from "../utils.js";

const router = Router();
const DELIVERY_FEE = Number(process.env.DELIVERY_FEE || 0);
const ESTIMATED_MINUTES = Number(process.env.ESTIMATED_MINUTES || 40);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  message: { error: "Too many requests. Please wait a minute and try again." },
});

router.post("/", limiter, asyncHandler(async (req, res) => {
  const { customer = {}, items } = req.body;
  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const address = String(customer.address || "").trim();
  const notes = String(customer.notes || "").trim();
  if (name.length < 1 || name.length > 80) return res.status(400).json({ error: "Please enter your name." });
  if (!/^[0-9+()\-.\s]{7,20}$/.test(phone)) return res.status(400).json({ error: "Please enter a valid phone number." });
  if (address.length < 5 || address.length > 200) return res.status(400).json({ error: "Please enter your delivery address." });
  if (notes.length > 300) return res.status(400).json({ error: "Delivery instructions are too long (300 letters max)." });
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    return res.status(400).json({ error: "Your cart is empty." });
  }
  const wanted = new Map(); 
  for (const item of items) {
    const slug = String(item.slug || "");
    const quantity = Number(item.quantity);
    if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "One of the items in your cart is not valid." });
    }
    wanted.set(slug, (wanted.get(slug) || 0) + quantity);
  }

  const slugs = [...wanted.keys()];
  const [rows] = await pool.query(
    "SELECT id, slug, name, price FROM menu_items WHERE available = 1 AND slug IN (?)",
    [slugs]
  );
  if (rows.length !== slugs.length) {
    return res.status(400).json({ error: "An item in your cart is no longer available. Please check your cart." });
  }
  const lines = rows.map((row) => ({ ...row, quantity: wanted.get(row.slug) }));
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const total = round2(subtotal + DELIVERY_FEE);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let orderId = null;
    let orderNumber = "";
    for (let attempt = 0; attempt < 5 && orderId === null; attempt++) {
      orderNumber = makeOrderNumber();
      try {
        const [result] = await conn.query(
          `INSERT INTO orders
             (order_number, customer_name, phone, address, notes, subtotal, delivery_fee, total, estimated_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderNumber, name, phone, address, notes || null, subtotal, DELIVERY_FEE, total, ESTIMATED_MINUTES]
        );
        orderId = result.insertId;
      } catch (err) {
        if (err.code !== "ER_DUP_ENTRY") throw err; 
      }
    }
    if (orderId === null) throw new Error("Could not create an order number");

    await conn.query(
      "INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity) VALUES ?",
      [lines.map((l) => [orderId, l.id, l.name, l.price, l.quantity])]
    );

    await conn.commit();
    res.status(201).json({ orderNumber, subtotal, deliveryFee: DELIVERY_FEE, total, estimatedMinutes: ESTIMATED_MINUTES });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.get("/:orderNumber", limiter, asyncHandler(async (req, res) => {
  const number = String(req.params.orderNumber).trim().toUpperCase();
  if (!isOrderNumber(number)) return res.status(400).json({ error: "That order number does not look right. It looks like FR-ABCD2345." });

  const [rows] = await pool.query(
    `SELECT id, order_number, status, total, estimated_minutes,
            TIMESTAMPDIFF(MINUTE, created_at, NOW()) AS minutes_since
     FROM orders WHERE order_number = ?`,
    [number]
  );
  if (rows.length === 0) return res.status(404).json({ error: "We could not find that order number." });

  const order = rows[0];
  const [items] = await pool.query("SELECT name, quantity FROM order_items WHERE order_id = ?", [order.id]);

  res.json({
    orderNumber: order.order_number,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    total: order.total,
    minutesLeft: Math.max(0, order.estimated_minutes - order.minutes_since),
    items,
  });
}));

router.post("/:orderNumber/cancel", limiter, asyncHandler(async (req, res) => {
  const number = String(req.params.orderNumber).trim().toUpperCase();
  if (!isOrderNumber(number)) return res.status(400).json({ error: "That order number does not look right." });

  const [result] = await pool.query(
    "UPDATE orders SET status = 'cancelled' WHERE order_number = ? AND status = 'received'",
    [number]
  );
  if (result.affectedRows === 1) return res.json({ message: `Order ${number} has been cancelled.` });

  const [rows] = await pool.query("SELECT status FROM orders WHERE order_number = ?", [number]);
  if (rows.length === 0) return res.status(404).json({ error: "We could not find that order number." });
  if (rows[0].status === "cancelled") return res.json({ message: `Order ${number} was already cancelled.` });

  res.status(409).json({
    error: `Order ${number} is already "${STATUS_LABELS[rows[0].status].toLowerCase()}", so it cannot be cancelled online. Please call us at ${STORE_PHONE}.`,
  });
}));

export default router;