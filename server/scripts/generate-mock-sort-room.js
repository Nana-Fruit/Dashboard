// Generates mock datasets for the sort-room dashboards (sorting + packing —
// both live under the same upstream "sort-room" API). Run:
//   npm --workspace server run mock:gen
//
// Sorting record shape (matches the real API):
//   { recordId, lotDate, recordDate, productName, supplier, orderName,
//     grades: [{ grade, weightKg }], totalGradeWeightKg,
//     foreignObjects: [{ type, weightKg }], totalForeignWeightKg, totalWeightKg,
//     employees: [{ type, count }], totalWorkingHours, updatedAt }
//
// Packing record shape (matches the real API):
//   { recordId, lotDate, recordDate, productName, productId, customer, supplier,
//     orderName, packingDestination, mfgDate, expDate,
//     packDetails: [{ bagType, bagCount, weightPerBagG, emptyBagWeightG, bagProductId,
//                      boxType, bagsPerBox, boxProductId }],
//     stickers: [{ stickerType, stickerCount, stickerProductId }],
//     totalBagsCount, totalBoxesCount, totalWeightKg, shiftType,
//     employees: [{ type, count }], totalWorkingHours, updatedAt }

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SORTING_OUT = join(__dirname, "..", "src", "mock", "sortingRecords.json");
const PACKING_OUT = join(__dirname, "..", "src", "mock", "packingRecords.json");

const PRODUCTS = ["มะนาว", "ส้มเลือด", "แก้วมังกรแดง", "Tidbit", "มะม่วงโชคอนันต์", "สับปะรดปัตตาเวีย", "แตงโม", "กล้วย"];
const SUPPLIERS = ["สวนคุณสมชาย", "สวนคุณประไพ", "สหกรณ์บ้านนา", "สวนคุณวิชัย", "ฟาร์มคุณดาว"];
const CUSTOMERS = ["Tesco Lotus", "Makro", "Big C", "7-Eleven DC", "Export - Japan", "Export - Korea"];
const DESTINATIONS = ["แพ็คเข้าคลัง", "ส่งลูกค้าโดยตรง", "ส่งออก"];
const SHIFTS = ["เช้า", "บ่าย"];

const rand = (min, max) => min + Math.random() * (max - min);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const id = () =>
  Array.from({ length: 20 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
  ).join("");
const isoDaysAgo = (base, d) => {
  const dt = new Date(base);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().slice(0, 10);
};
const addDays = (iso, n) => {
  const dt = new Date(iso);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const today = new Date("2026-09-11");
const TOTAL = 65;

// --- sorting -----------------------------------------------------------
const sortingRecords = [];
for (let i = 0; i < TOTAL; i++) {
  const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 75);
  const lotDate = isoDaysAgo(today, daysAgo);
  const recordDate = lotDate;

  const totalIn = round(rand(300, 2500));
  const aPct = rand(0.35, 0.6);
  const bPct = rand(0.2, 0.35);
  const cPct = Math.max(0.05, 1 - aPct - bPct);
  const grades = [
    { grade: "A", weightKg: round(totalIn * aPct) },
    { grade: "B", weightKg: round(totalIn * bPct) },
    { grade: "C", weightKg: round(totalIn * cPct) },
  ];
  const totalGradeWeightKg = round(grades.reduce((s, g) => s + g.weightKg, 0));
  const totalForeignWeightKg = round(totalIn * rand(0, 0.03), 2);
  const foreignObjects = totalForeignWeightKg > 0 ? [{ type: "สิ่งแปลกปลอม", weightKg: totalForeignWeightKg }] : [];
  const totalWeightKg = round(totalGradeWeightKg + totalForeignWeightKg, 2);

  sortingRecords.push({
    recordId: id(),
    lotDate,
    recordDate,
    productName: pick(PRODUCTS),
    supplier: pick(SUPPLIERS),
    orderName: Math.random() < 0.6 ? `ORD-${1000 + i}` : "",
    grades,
    totalGradeWeightKg,
    foreignObjects,
    totalForeignWeightKg,
    totalWeightKg,
    employees: [{ type: Math.random() < 0.8 ? "daily_temp" : "monthly", count: Math.floor(rand(8, 18)) }],
    totalWorkingHours: round(rand(6, 9), 1),
    updatedAt: new Date(lotDate + "T08:00:00.000Z").toISOString(),
  });
}
sortingRecords.sort((a, b) => b.lotDate.localeCompare(a.lotDate));

// --- packing -------------------------------------------------------------
const packingRecords = [];
for (let i = 0; i < TOTAL; i++) {
  const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 75);
  const lotDate = isoDaysAgo(today, daysAgo);
  const recordDate = lotDate;
  const mfgDate = lotDate;
  const expDate = addDays(lotDate, Math.floor(rand(60, 120)));

  const bagCount = Math.floor(rand(20, 400));
  const weightPerBagG = pick([100, 200, 500, 1000]);
  const totalWeightKg = round((bagCount * weightPerBagG) / 1000, 2);
  const bagsPerBox = pick([10, 20, 24]);
  const boxesCount = Math.max(1, Math.round(bagCount / bagsPerBox));

  packingRecords.push({
    recordId: id(),
    lotDate,
    recordDate,
    productName: pick(PRODUCTS),
    productId: `PRD-${100 + (i % PRODUCTS.length)}`,
    customer: pick(CUSTOMERS),
    supplier: pick(SUPPLIERS),
    orderName: Math.random() < 0.6 ? `ORD-${2000 + i}` : "",
    packingDestination: pick(DESTINATIONS),
    mfgDate,
    expDate,
    packDetails: [
      {
        bagType: "ถุงซีล",
        bagCount,
        weightPerBagG,
        emptyBagWeightG: 8,
        bagProductId: `BAG-${weightPerBagG}`,
        boxType: "กล่องลัง",
        bagsPerBox,
        boxProductId: `BOX-${bagsPerBox}`,
      },
    ],
    stickers: [{ stickerType: "ฉลากสินค้า", stickerCount: bagCount, stickerProductId: "STK-001" }],
    totalBagsCount: bagCount,
    totalBoxesCount: boxesCount,
    totalWeightKg,
    shiftType: pick(SHIFTS),
    employees: [{ type: Math.random() < 0.7 ? "monthly" : "daily_temp", count: Math.floor(rand(6, 16)) }],
    totalWorkingHours: round(rand(6, 9), 1),
    updatedAt: new Date(lotDate + "T09:30:00.000Z").toISOString(),
  });
}
packingRecords.sort((a, b) => b.lotDate.localeCompare(a.lotDate));

mkdirSync(dirname(SORTING_OUT), { recursive: true });
writeFileSync(SORTING_OUT, JSON.stringify(sortingRecords, null, 2) + "\n");
console.log(`Wrote ${sortingRecords.length} mock sorting records to ${SORTING_OUT}`);

writeFileSync(PACKING_OUT, JSON.stringify(packingRecords, null, 2) + "\n");
console.log(`Wrote ${packingRecords.length} mock packing records to ${PACKING_OUT}`);
