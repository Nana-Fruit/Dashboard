// Mock Sales Orders for the Office dashboard.
// Run via:  npm --workspace server run mock:gen
//
// Shape (keep in sync with routes/office.js and, later, the real API):
//   { orderId, orderDate, market: "domestic"|"international", country,
//     customerName, salesRep, currency, amountTHB, status }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "salesOrders.json");

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const round = (n) => Math.round(n);
const id = (i) => `SO-2026-${String(i).padStart(4, "0")}`;

const SALES_REPS = ["ปรีชา", "มนัสนันท์", "Somchai", "Naruemon", "Kittipong"];

const DOMESTIC_CUSTOMERS = [
  "บจก. สยามฟรุ๊ตส์", "บจก. กรุงเทพขนมหวาน", "แม็คโครสาขาราชพฤกษ์", "บจก. ท็อปส์ รีเทล",
  "บจก. เอเชียเฮลตี้สแน็ค", "ร้านของฝากเชียงใหม่", "บจก. ซีพี ออลล์", "บจก. อีเทอเนิล ฟู้ด",
];
const INTL_CUSTOMERS = [
  ["Green Valley Foods", "USA"], ["Tokyo Dried Fruits Co.", "Japan"],
  ["EuroSnack GmbH", "Germany"], ["Golden Harvest Pte", "Singapore"],
  ["Dubai Gourmet Trading", "UAE"], ["Seoul Natural Snacks", "South Korea"],
  ["Nordic Organic AB", "Sweden"], ["Sydney Health Imports", "Australia"],
];
const STATUSES = ["confirmed", "shipped", "invoiced", "paid"];

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
    const orderDate = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let customerName, country, currency, amountTHB;
    if (isDomestic) {
      customerName = pick(DOMESTIC_CUSTOMERS);
      country = "Thailand";
      currency = "THB";
      amountTHB = round(rand(40_000, 260_000));
    } else {
      const [name, ctry] = pick(INTL_CUSTOMERS);
      customerName = name;
      country = ctry;
      currency = pick(["USD", "EUR", "USD", "USD"]);
      amountTHB = round(rand(150_000, 620_000));
    }

    orders.push({
      orderId: id(n++),
      orderDate,
      market: isDomestic ? "domestic" : "international",
      country,
      customerName,
      salesRep: pick(SALES_REPS),
      currency,
      amountTHB,
      status: pick(STATUSES),
    });
  }
}

orders.sort((a, b) => b.orderDate.localeCompare(a.orderDate));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(orders, null, 2) + "\n");
console.log(`Wrote ${orders.length} sales orders to ${OUT}`);
