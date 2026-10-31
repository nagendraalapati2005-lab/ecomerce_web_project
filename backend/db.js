import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "nagendra",
  database: process.env.DB_NAME || "frankis_pizzeria",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // prices come back as numbers, not text
});
