import { Router } from "express";
import { pool } from "../db.js";
import { asyncHandler } from "../utils.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const [items] = await pool.query(
    "SELECT slug, name, description, price, category FROM menu_items WHERE available = 1 ORDER BY id"
  );
  res.json({ items });
}));

export default router;
