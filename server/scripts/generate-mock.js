// Generates a realistic mock dataset for the dry-room dashboard so we can build
// the UI without calling the real API. Run:  npm --workspace server run mock:gen
//
// The shape matches the real API exactly:
//   { batchId, status, lotDate, productName, inputWeightKg,
//     totalOutputWeightKg, yieldPercent, totalWorkingHours, updatedAt }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "batches.json");

// product name -> typical yield % (mid) and daily input capacity range (kg)
const PRODUCTS = {
  "มะนาว": { yield: 17, inputMin: 400, inputMax: 2600 },
  "ส้มเลือด": { yield: 17, inputMin: 500, inputMax: 6600 },
  "แก้วมังกรแดง": { yield: 17, inputMin: 600, inputMax: 3200 },
  "แก้วมังกรขาว": { yield: 16, inputMin: 400, inputMax: 1800 },
  "Tidbit": { yield: 45, inputMin: 300, inputMax: 2200 },
  "มะม่วงโชคอนันต์": { yield: 27, inputMin: 300, inputMax: 1500 },
  "เมล็ดมะม่วงโชคอนันต์": { yield: 22, inputMin: 150, inputMax: 700 },
  "สับปะรดปัตตาเวีย": { yield: 11, inputMin: 150, inputMax: 900 },
  "แตงโม": { yield: 8, inputMin: 120, inputMax: 500 },
  "กล้วย": { yield: 30, inputMin: 200, inputMax: 1200 },
};

const rand = (min, max) => min + Math.random() * (max - min);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const id = () =>
  Array.from({ length: 20 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");

const names = Object.keys(PRODUCTS);
const TOTAL = 72;
const today = new Date("2026-08-28");

const batches = [];
for (let i = 0; i < TOTAL; i++) {
  const name = pick(names);
  const spec = PRODUCTS[name];

  // spread lots over the last ~80 days, weighted toward recent
  const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 80);
  const lot = new Date(today);
  lot.setDate(lot.getDate() - daysAgo);
  const lotDate = lot.toISOString().slice(0, 10);

  // recent 3 days are more likely to still be processing
  const processing = daysAgo <= 2 ? Math.random() < 0.8 : Math.random() < 0.12;
  const status = processing ? "dry_processing" : "dry_done";

  const inputWeightKg = round(rand(spec.inputMin, spec.inputMax), 2);
  const totalWorkingHours = round(rand(6, 24) * (inputWeightKg > 3000 ? 4 : inputWeightKg > 1500 ? 2.2 : 1), 1);

  let totalOutputWeightKg = 0;
  let yieldPercent = 0;
  if (status === "dry_done") {
    yieldPercent = round(spec.yield + rand(-4, 4), 2);
    totalOutputWeightKg = round((inputWeightKg * yieldPercent) / 100, 2);
  }

  const updated = new Date(lot);
  updated.setDate(updated.getDate() + (status === "dry_done" ? 2 : 1));
  updated.setHours(Math.floor(rand(1, 20)), Math.floor(rand(0, 59)));

  batches.push({
    batchId: id(),
    status,
    lotDate,
    productName: name,
    inputWeightKg,
    totalOutputWeightKg,
    yieldPercent,
    totalWorkingHours,
    updatedAt: updated.toISOString(),
  });
}

batches.sort((a, b) => b.lotDate.localeCompare(a.lotDate));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(batches, null, 2) + "\n");
console.log(`Wrote ${batches.length} mock batches to ${OUT}`);
