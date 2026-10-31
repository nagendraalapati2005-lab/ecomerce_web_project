import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { pool } from "./db.js";
import { STORE_PHONE } from "./utils.js";
import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import supportRoutes from "./routes/support.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const PAGES_DIR = process.env.PAGES_DIR || "pages";

const app = express();
app.use(cors());                         
app.use(express.json({ limit: "20kb" })); 
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 })); 

app.get("/api/config", (req, res) => {
  res.json({
    deliveryFee: Number(process.env.DELIVERY_FEE || 0),
    estimatedMinutes: Number(process.env.ESTIMATED_MINUTES || 40),
    phone: STORE_PHONE,
  });
});
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "That API address does not exist." }));

const siteRoot = path.join(__dirname, "..");
for (const folder of ["assets", "frontend", PAGES_DIR]) {
  app.use("/" + folder, express.static(path.join(siteRoot, folder)));
}
app.get("/", (req, res) => res.redirect(`/${PAGES_DIR}/index.html`));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Bad request." });
  console.error(err);
  res.status(500).json({ error: "Server error. Please try again in a moment." });
});

app.listen(PORT, () => {
  console.log(`Website and API running on http://localhost:${PORT}`);
  pool.query("SELECT 1")
    .then(() => console.log("Database connected"))
    .catch((err) => console.error("Database connection FAILED:", err.message));
});

