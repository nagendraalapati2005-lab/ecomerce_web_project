import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const useSsl = process.env.DB_SSL === "true";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME || "frankis_pizzeria",
  ssl: useSsl ? { ca: fs.readFileSync(path.join(__dirname, "ca.pem")) } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, 
});
