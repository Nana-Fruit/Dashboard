// Mock Sales Orders for the Office dashboard.
// Run via:  npm --workspace server run mock:gen
//
// Shape matches the real upstream endpoint (GET /external/v1/sales-orders),
// so mock and live data flow through the same mapper in
// server/src/api/officeApi.js:
//   { id, po_number, customer_name, order_type: "domestic"|"international",
//     total_amount, opened_at, items: [{ sku, product_name, unit, quantity }] }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "salesOrders.json");

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const round = (n) => Math.round(n);
const externalId = () => randomBytes(20).toString("hex");
const poNumber = (i) => `SO${String(20260000 + i).padStart(5, "0")}/${String(i).padStart(5, "0")}`;

const DOMESTIC_CUSTOMERS = [
  "บจก. สยามฟรุ๊ตส์", "บจก. กรุงเทพขนมหวาน", "แม็คโครสาขาราชพฤกษ์", "บจก. ท็อปส์ รีเทล",
  "บจก. เอเชียเฮลตี้สแน็ค", "ร้านของฝากเชียงใหม่", "บจก. ซีพี ออลล์", "บจก. อีเทอเนิล ฟู้ด",
];
const INTL_CUSTOMERS = [
  "Green Valley Foods", "Tokyo Dried Fruits Co.", "EuroSnack GmbH", "Golden Harvest Pte",
  "Dubai Gourmet Trading", "Seoul Natural Snacks", "Nordic Organic AB", "Sydney Health Imports",
];

const SKUS = [
  { sku: "SKU0000001", product_name: "มะม่วงอบแห้ง", unit: "ซอง" },
  { sku: "SKU0000002", product_name: "กล้วยอบแห้ง", unit: "ซอง" },
  { sku: "SKU0000003", product_name: "สับปะรดอบแห้ง", unit: "ซอง" },
  { sku: "SKU0000004", product_name: "มะละกออบแห้ง", unit: "ซอง" },
  { sku: "SKU0000005", product_name: "รวมมิตรผลไม้อบแห้ง", unit: "กล่อง" },
  { sku: "SKU0000006", product_name: "ทุเรียนทอดกรอบ", unit: "ถุง" },
];

function randomItems() {
  const count = randInt(1, 4);
  const chosen = [...SKUS].sort(() => Math.random() - 0.5).slice(0, count);
  return chosen.map(({ sku, product_name, unit }) => ({ sku, product_name, unit, quantity: randInt(10, 200) }));
}

const orders = [];
let n = 1;
const TODAY = 28; // 2026-08-28: August is the current, partial month
// Jun, Jul (full) + Aug (through day 28)
for (const month of [6, 7, 8]) {
  const lastDay = month === 8 ? TODAY : 28;
  const perMonth = Math.floor(rand(55, 75) * (month === 8 ? TODAY / 30 : 1));
  for (let i = 0; i < perMonth; i++) {
    const isDomestic = Math.random() < 0.55;
    const day = Math.max(1, Math.min(lastDay, Math.floor(rand(1, lastDay + 1))));
    const opened_at = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const customer_name = isDomestic ? pick(DOMESTIC_CUSTOMERS) : pick(INTL_CUSTOMERS);
    const total_amount = isDomestic ? round(rand(40_000, 260_000)) : round(rand(150_000, 620_000));

    orders.push({
      id: externalId(),
      po_number: poNumber(n++),
      customer_name,
      order_type: isDomestic ? "domestic" : "international",
      total_amount,
      opened_at,
      items: randomItems(),
    });
  }
}

orders.sort((a, b) => b.opened_at.localeCompare(a.opened_at));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(orders, null, 2) + "\n");
console.log(`Wrote ${orders.length} sales orders to ${OUT}`);
