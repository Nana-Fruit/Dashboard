// Mock Online-channel orders (TikTok Shop, Shopee, Lazada, LINE OA).
// Run via:  npm --workspace server run mock:gen
//
// No upstream API for this yet - each channel deducts its own commission/
// payment fee, so gross_amount (before fees) and net_amount (after fees)
// are both stored rather than derived, matching what the real channel
// settlement reports will eventually give us.
//   { id, order_no, channel, opened_at, items: [{ sku, product_name, quantity }],
//     free_items: [{ sku, product_name, quantity }], promotion_name,
//     gross_amount, net_amount }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "onlineOrders.json");

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const round = (n) => Math.round(n);
const externalId = () => randomBytes(20).toString("hex");
const orderNo = (i) => `OL${String(20260000 + i).padStart(5, "0")}`;

// channel -> total fee rate range (commission + payment gateway combined)
const CHANNELS = [
  { name: "TikTok Shop", feeMin: 0.08, feeMax: 0.12 },
  { name: "Shopee", feeMin: 0.05, feeMax: 0.09 },
  { name: "Lazada", feeMin: 0.05, feeMax: 0.09 },
  { name: "LINE OA", feeMin: 0.02, feeMax: 0.04 },
];

const SKUS = [
  { sku: "SKU0000001", product_name: "มะม่วงอบแห้ง" },
  { sku: "SKU0000002", product_name: "กล้วยอบแห้ง" },
  { sku: "SKU0000003", product_name: "สับปะรดอบแห้ง" },
  { sku: "SKU0000004", product_name: "มะละกออบแห้ง" },
  { sku: "SKU0000005", product_name: "รวมมิตรผลไม้อบแห้ง" },
  { sku: "SKU0000006", product_name: "ทุเรียนทอดกรอบ" },
];

const PROMOTIONS = [
  "Flash Sale ลด 20%",
  "ซื้อ 2 แถม 1",
  "ลดราคาพิเศษ 10%",
  "ส่งฟรีทั่วไทย",
  "โค้ดส่วนลด 50 บาท",
  null, // no promotion
  null,
  null,
];

function randomItems() {
  const count = randInt(1, 3);
  const chosen = [...SKUS].sort(() => Math.random() - 0.5).slice(0, count);
  return chosen.map(({ sku, product_name }) => ({ sku, product_name, quantity: randInt(1, 10) }));
}

function randomFreeItems() {
  if (Math.random() < 0.6) return []; // most orders have no free gift
  const count = randInt(1, 2);
  const chosen = [...SKUS].sort(() => Math.random() - 0.5).slice(0, count);
  return chosen.map(({ sku, product_name }) => ({ sku, product_name, quantity: randInt(1, 2) }));
}

const orders = [];
let n = 1;
const TODAY = 28; // 2026-08-28: August is the current, partial month
for (const month of [6, 7, 8]) {
  const lastDay = month === 8 ? TODAY : 28;
  const perMonth = Math.floor(rand(70, 110) * (month === 8 ? TODAY / 30 : 1));
  for (let i = 0; i < perMonth; i++) {
    const day = Math.max(1, Math.min(lastDay, Math.floor(rand(1, lastDay + 1))));
    const opened_at = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const channel = pick(CHANNELS);
    const gross_amount = round(rand(300, 4_500));
    const feeRate = rand(channel.feeMin, channel.feeMax);
    const net_amount = round(gross_amount * (1 - feeRate));

    orders.push({
      id: externalId(),
      order_no: orderNo(n++),
      channel: channel.name,
      opened_at,
      items: randomItems(),
      free_items: randomFreeItems(),
      promotion_name: pick(PROMOTIONS),
      gross_amount,
      net_amount,
    });
  }
}

orders.sort((a, b) => b.opened_at.localeCompare(a.opened_at));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(orders, null, 2) + "\n");
console.log(`Wrote ${orders.length} online orders to ${OUT}`);
