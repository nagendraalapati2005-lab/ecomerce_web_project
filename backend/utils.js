import crypto from "crypto";

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeOrderNumber() {
  let text = "";
  for (const byte of crypto.randomBytes(8)) text += ALPHABET[byte % ALPHABET.length];
  return "FR-" + text;
}
export const isOrderNumber = (value) => /^FR-[A-HJ-NP-Z2-9]{8}$/.test(value);

export const STATUS_LABELS = {
  received: "Received",
  preparing: "Being prepared",
  baking: "In the oven",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const round2 = (n) => Math.round(n * 100) / 100;
export const STORE_PHONE = process.env.STORE_PHONE || "807-356-XXXX";