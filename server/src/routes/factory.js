import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { requireAuth, requireFactory, requireEdit } from "../auth/middleware.js";
import { store } from "../data/store.js";

const ROOMS_PATH = fileURLToPath(new URL("../mock/factoryRooms.json", import.meta.url));
const loadRecords = () => JSON.parse(readFileSync(ROOMS_PATH, "utf8"));

const ROOM_ORDER = ["fresh", "sorting", "drying", "packing"];
const ROOM_LABEL = { fresh: "ห้องสด", sorting: "ห้องคัด", drying: "ห้องอบ", packing: "ห้องแพ็ค" };

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);

function inRange(records, { from, to }) {
  return records.filter((r) => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });
}

export const factory = Router();
factory.use(requireAuth, requireFactory);

// --- cost + yield across all rooms --------------------------------
factory.get("/summary", (req, res) => {
  const records = inRange(loadRecords(), req.query);
  const rates = store.getLaborRates();

  const rooms = ROOM_ORDER.map((room) => {
    const rows = records.filter((r) => r.room === room);
    const inputKg = sum(rows, (r) => r.inputWeightKg);
    const outputKg = sum(rows, (r) => r.outputWeightKg);
    const workingHours = round(sum(rows, (r) => r.workingHours), 1);
    const rate = rates[room] || 0;
    return {
      room,
      label: ROOM_LABEL[room],
      records: rows.length,
      inputKg: round(inputKg),
      outputKg: round(outputKg),
      yieldPercent: inputKg ? round((outputKg / inputKg) * 100) : 0,
      avgEmployees: rows.length ? round(sum(rows, (r) => r.employees) / rows.length, 1) : 0,
      workingHours,
      laborRatePerHour: rate,
      laborCostTHB: round(workingHours * rate),
    };
  });

  res.json({
    source: "mock",
    editable: req.user.role === "admin",
    range: { from: req.query.from || null, to: req.query.to || null },
    rooms,
    totals: {
      laborCostTHB: round(sum(rooms, (r) => r.laborCostTHB)),
      workingHours: round(sum(rooms, (r) => r.workingHours), 1),
    },
  });
});

// --- fresh-room detail (RM in / trimmed / yield / staff) ----------
factory.get("/rooms/:room", (req, res) => {
  const room = req.params.room;
  if (!ROOM_ORDER.includes(room)) return res.status(404).json({ error: "ไม่พบห้องนี้" });
  const rates = store.getLaborRates();
  const rows = inRange(loadRecords(), req.query)
    .filter((r) => r.room === room)
    .map((r) => ({ ...r, laborCostTHB: round(r.workingHours * (rates[room] || 0)) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // per-product summary: total RM in, total output, weight-weighted yield
  const map = new Map();
  for (const r of rows) {
    const k = r.productName || "-";
    if (!map.has(k)) map.set(k, { product: k, records: 0, inputKg: 0, outputKg: 0 });
    const g = map.get(k);
    g.records += 1;
    g.inputKg += r.inputWeightKg || 0;
    g.outputKg += r.outputWeightKg || 0;
  }
  const byProduct = [...map.values()]
    .map((g) => ({
      ...g,
      inputKg: round(g.inputKg),
      outputKg: round(g.outputKg),
      yieldPercent: g.inputKg ? round((g.outputKg / g.inputKg) * 100) : 0,
    }))
    .sort((a, b) => b.yieldPercent - a.yieldPercent);

  const withYield = byProduct.filter((p) => p.inputKg > 0);
  const extremes = withYield.length
    ? { highest: withYield[0], lowest: withYield[withYield.length - 1] }
    : { highest: null, lowest: null };

  res.json({
    room,
    label: ROOM_LABEL[room],
    count: rows.length,
    totals: {
      inputKg: round(byProduct.reduce((a, p) => a + p.inputKg, 0)),
      outputKg: round(byProduct.reduce((a, p) => a + p.outputKg, 0)),
    },
    byProduct,
    extremes,
    records: rows,
  });
});

// --- set labor rates (Admin only) -------------------------------
factory.put("/labor-rates", requireEdit, (req, res) => {
  const rates = req.body || {};
  const clean = {};
  for (const k of ROOM_ORDER) if (rates[k] != null) clean[k] = Number(rates[k]) || 0;
  res.json({ laborRatePerHour: store.setLaborRates(clean) });
});
