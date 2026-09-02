// Mock daily production records for all 4 factory rooms.
// Run via:  npm --workspace server run mock:gen
//
// Uniform shape across rooms (keep in sync with routes/factory.js):
//   { date, room: "fresh"|"sorting"|"packing"|"drying", productName,
//     inputWeightKg, outputWeightKg, yieldPercent, employees, workingHours }
//
//   fresh   : input = RM รับเข้า, output = น้ำหนักหลังตัดแต่ง
//   sorting : input = จากห้องสด,   output = ผ่านการคัด
//   drying  : input = จากห้องคัด,  output = หลังอบ
//   packing : input = จากห้องอบ,   output = แพ็คสำเร็จ
//   workingHours = man-hours รวมของห้องนั้นในวันนั้น

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "mock", "factoryRooms.json");

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const PRODUCTS = ["มะนาว", "ส้มเลือด", "แก้วมังกรแดง", "Tidbit", "มะม่วงโชคอนันต์", "สับปะรดปัตตาเวีย", "แตงโม", "กล้วย"];

// room -> { yield mid%, staff range, hours/person range }
const ROOMS = {
  fresh:   { yield: 78, staff: [8, 20], hrs: [7, 9] },
  sorting: { yield: 92, staff: [6, 14], hrs: [7, 9] },
  drying:  { yield: 18, staff: [4, 10], hrs: [8, 12] },
  packing: { yield: 96, staff: [6, 16], hrs: [7, 9] },
};

// Each product trims differently in the fresh room — a stable bias so the
// per-product summary shows a real spread (best vs worst yield).
const FRESH_YIELD_BIAS = {
  "มะนาว": -4, "ส้มเลือด": 8, "แก้วมังกรแดง": -10, "Tidbit": 5,
  "มะม่วงโชคอนันต์": 2, "สับปะรดปัตตาเวีย": -8, "แตงโม": -14, "กล้วย": 10,
};

const today = new Date("2026-08-28");
const DAYS = 70;

const records = [];
for (let d = 0; d < DAYS; d++) {
  const date = new Date(today);
  date.setDate(date.getDate() - d);
  const iso = date.toISOString().slice(0, 10);
  const dow = date.getDay();
  if (dow === 0) continue; // no Sunday shift

  // 1-3 products processed that day, shared across rooms
  const todaysProducts = Array.from({ length: Math.floor(rand(1, 4)) }, () => pick(PRODUCTS));

  for (const product of new Set(todaysProducts)) {
    let carry = round(rand(400, 4000)); // RM into the fresh room
    for (const room of ["fresh", "sorting", "drying", "packing"]) {
      const spec = ROOMS[room];
      const input = carry;
      const bias = room === "fresh" ? (FRESH_YIELD_BIAS[product] || 0) : 0;
      const y = round(spec.yield + bias + rand(-3, 3), 2);
      const output = round((input * y) / 100, 2);
      const employees = Math.floor(rand(spec.staff[0], spec.staff[1] + 1));
      const workingHours = round(employees * rand(spec.hrs[0], spec.hrs[1]), 1);

      records.push({
        date: iso,
        room,
        productName: product,
        inputWeightKg: input,
        outputWeightKg: output,
        yieldPercent: y,
        employees,
        workingHours,
      });
      carry = output; // feeds the next room
    }
  }
}

records.sort((a, b) => b.date.localeCompare(a.date));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(records, null, 2) + "\n");
console.log(`Wrote ${records.length} factory room records to ${OUT}`);
