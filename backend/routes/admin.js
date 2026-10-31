import { Router } from "express";
import { pool } from "../db.js";
import { asyncHandler, isOrderNumber, STATUS_LABELS } from "../utils.js";

const router = Router();

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key || key === "change-me" || req.get("x-admin-key") !== key) {
    return res.status(401).json({ error: "Admin key missing or wrong." });
  }
  next();
}
router.use(requireAdmin);
router.get("/orders", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const sql = `SELECT o.order_number, o.customer_name, o.phone, o.address, o.total, o.status, o.created_at,
                 (SELECT GROUP_CONCAT(CONCAT(quantity, ' x ', name) SEPARATOR ', ') FROM order_items WHERE order_id = o.id) AS items
               FROM orders o ${status ? "WHERE o.status = ?" : ""} ORDER BY o.created_at DESC LIMIT 100`;
  const [orders] = await pool.query(sql, status ? [status] : []);
  res.json({ orders });
}));

router.get("/orders/:orderNumber", asyncHandler(async (req, res) => {
  const number = req.params.orderNumber.toUpperCase();
  const [rows] = await pool.query("SELECT * FROM orders WHERE order_number = ?", [number]);
  if (rows.length === 0) return res.status(404).json({ error: "Order not found." });
  const [items] = await pool.query(
    "SELECT name, unit_price, quantity FROM order_items WHERE order_id = ?", [rows[0].id]
  );
  res.json({ order: rows[0], items });
}));

router.patch("/orders/:orderNumber/status", asyncHandler(async (req, res) => {
  const number = req.params.orderNumber.toUpperCase();
  const { status } = req.body;
  if (!isOrderNumber(number)) return res.status(400).json({ error: "Bad order number." });
  if (!Object.keys(STATUS_LABELS).includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${Object.keys(STATUS_LABELS).join(", ")}` });
  }
  const [result] = await pool.query("UPDATE orders SET status = ? WHERE order_number = ?", [status, number]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found." });
  res.json({ message: `Order ${number} is now "${status}".` });
}));

// ----- Customer messages -----
router.get("/support", asyncHandler(async (req, res) => {
  const [messages] = await pool.query("SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 100");
  res.json({ messages });
}));

router.patch("/support/:id", asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "done"].includes(status)) return res.status(400).json({ error: "Status must be new or done." });
  const [result] = await pool.query("UPDATE support_messages SET status = ? WHERE id = ?", [status, Number(req.params.id)]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Message not found." });
  res.json({ message: "Updated." });
}));
router.patch("/menu/:slug", asyncHandler(async (req, res) => {
  const { price, available } = req.body;
  const changes = [];
  const values = [];
  if (price !== undefined) {
    const p = Number(price);
    if (!(p >= 0 && p <= 500)) return res.status(400).json({ error: "Price must be a number between 0 and 500." });
    changes.push("price = ?"); values.push(p);
  }
  if (available !== undefined) {
    changes.push("available = ?"); values.push(available ? 1 : 0);
  }
  if (changes.length === 0) return res.status(400).json({ error: "Send a price and/or available value." });
  const [result] = await pool.query(`UPDATE menu_items SET ${changes.join(", ")} WHERE slug = ?`, [...values, req.params.slug]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Menu item not found." });
  res.json({ message: "Menu item updated." });
}));

export default router;
