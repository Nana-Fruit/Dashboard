// Generates a realistic mock dataset for the fresh-room dashboard. Run:
//   npm --workspace server run mock:gen
//
// Shape matches the real API exactly:
//   { batchId, lotDate, productName, inputWeightKg, outputWeightKg,
//     yieldPercent, employees: [{ type, count }], totalWorkingHours, updatedAt }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "freshRoomBatches.json");

// product name -> typical trim yield % (RM in -> trimmed out) and daily input range (kg)
const PRODUCTS = {
  "มะนาว": { yield: 82, inputMin: 500, inputMax: 3000 },
  "ส้มเลือด": { yield: 88, inputMin: 600, inputMax: 4000 },
  "แก้วมังกรแดง": { yield: 70, inputMin: 700, inputMax: 3500 },
  "แก้วมังกรขาว": { yield: 72, inputMin: 500, inputMax: 2200 },
  "Tidbit": { yield: 90, inputMin: 400, inputMax: 2600 },
  "มะม่วงโชคอนันต์": { yield: 76, inputMin: 400, inputMax: 1800 },
  "สับปะรดปัตตาเวีย": { yield: 65, inputMin: 300, inputMax: 1200 },
  "แตงโม": { yield: 60, inputMin: 300, inputMax: 1000 },
  "กล้วย": { yield: 85, inputMin: 400, inputMax: 2800 },
};

const rand = (min, max) => min + Math.random() * (max - min);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const id = () =>
  Array.from({ length: 20 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");

const names = Object.keys(PRODUCTS);
const TOTAL = 70;
const today = new Date("2026-09-11");

const batches = [];
for (let i = 0; i < TOTAL; i++) {
  const name = pick(names);
  const spec = PRODUCTS[name];

  const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 75);
  const lot = new Date(today);
  lot.setDate(lot.getDate() - daysAgo);
  const lotDate = lot.toISOString().slice(0, 10);

  const inputWeightKg = round(rand(spec.inputMin, spec.inputMax), 2);
  const yieldPercent = round(spec.yield + rand(-6, 6), 2);
  const outputWeightKg = round((inputWeightKg * yieldPercent) / 100, 2);

  const dailyCount = Math.floor(rand(8, 20));
  const monthlyCount = Math.floor(rand(0, 4));
  const employees = [
    { type: "daily_temp", count: dailyCount },
    ...(monthlyCount > 0 ? [{ type: "monthly", count: monthlyCount }] : []),
  ];
  const totalWorkingHours = round(rand(6, 9), 1);

  const updated = new Date(lot);
  updated.setHours(Math.floor(rand(8, 20)), Math.floor(rand(0, 59)));

  batches.push({
    batchId: id(),
    lotDate,
    productName: name,
    inputWeightKg,
    outputWeightKg,
    yieldPercent,
    employees,
    totalWorkingHours,
    updatedAt: updated.toISOString(),
  });
}

batches.sort((a, b) => b.lotDate.localeCompare(a.lotDate));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(batches, null, 2) + "\n");
console.log(`Wrote ${batches.length} mock fresh-room batches to ${OUT}`);
