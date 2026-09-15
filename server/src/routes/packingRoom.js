import { Router } from "express";
import { config } from "../config.js";
import { getAllPackingRecords } from "../api/sortRoomApi.js";
import { requireAuth, requireFactory } from "../auth/middleware.js";

// Packing room (ห้องแพ็ค) detail view. Factory-side data, so same access rule.
export const packingRoom = Router();
packingRoom.use(requireAuth, requireFactory);

const api = packingRoom;

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
const employeeCount = (r) => sum(r.employees, (e) => e.count);

function applyFilters(records, { product, destination, from, to }) {
  return records.filter((r) => {
    if (product && r.productName !== product) return false;
    if (destination && r.packingDestination !== destination) return false;
    if (from && r.lotDate < from) return false;
    if (to && r.lotDate > to) return false;
    return true;
  });
}

// --- raw record list for the table (supports filters) -----------------
api.get("/records", async (req, res, next) => {
  try {
    const all = await getAllPackingRecords();
    const rows = applyFilters(all, req.query).sort((a, b) => b.lotDate.localeCompare(a.lotDate));
    res.json({ count: rows.length, records: rows });
  } catch (err) {
    next(err);
  }
});

// --- everything the dashboard needs in one call ----------------------
api.get("/dashboard", async (req, res, next) => {
  try {
    const all = await getAllPackingRecords();
    const records = applyFilters(all, req.query);

    const summary = {
      totalRecords: records.length,
      totalBagsCount: sum(records, (r) => r.totalBagsCount),
      totalBoxesCount: sum(records, (r) => r.totalBoxesCount),
      totalWeightKg: round(sum(records, (r) => r.totalWeightKg)),
      totalWorkingHours: round(sum(records, (r) => r.totalWorkingHours)),
      avgEmployees: records.length ? round(sum(records, employeeCount) / records.length, 1) : 0,
    };

    // weight packed by date
    const trendMap = new Map();
    for (const r of records) {
      if (!trendMap.has(r.lotDate)) trendMap.set(r.lotDate, { date: r.lotDate, weightKg: 0, bags: 0 });
      const t = trendMap.get(r.lotDate);
      t.weightKg += r.totalWeightKg || 0;
      t.bags += r.totalBagsCount || 0;
    }
    const weightTrend = [...trendMap.values()]
      .map((t) => ({ date: t.date, weightKg: round(t.weightKg), bags: t.bags }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // packed weight by destination
    const destMap = new Map();
    for (const r of records) {
      const key = r.packingDestination || "-";
      destMap.set(key, (destMap.get(key) || 0) + (r.totalWeightKg || 0));
    }
    const byDestination = [...destMap.entries()]
      .map(([destination, weightKg]) => ({ destination, weightKg: round(weightKg) }))
      .sort((a, b) => b.weightKg - a.weightKg);

    // per-product aggregates
    const byProductMap = new Map();
    for (const r of records) {
      const key = r.productName || "-";
      if (!byProductMap.has(key)) byProductMap.set(key, { product: key, records: 0, weightKg: 0, bags: 0, boxes: 0 });
      const g = byProductMap.get(key);
      g.records += 1;
      g.weightKg += r.totalWeightKg || 0;
      g.bags += r.totalBagsCount || 0;
      g.boxes += r.totalBoxesCount || 0;
    }
    const byProduct = [...byProductMap.values()]
      .map((g) => ({ product: g.product, records: g.records, weightKg: round(g.weightKg), bags: g.bags, boxes: g.boxes }))
      .sort((a, b) => b.weightKg - a.weightKg);

    const recentRecords = [...records]
      .sort((a, b) => b.lotDate.localeCompare(a.lotDate))
      .slice(0, 15)
      .map((r) => ({ ...r, employeeCount: employeeCount(r) }));

    const products = [...new Set(all.map((r) => r.productName))].filter(Boolean).sort();
    const destinations = [...new Set(all.map((r) => r.packingDestination))].filter(Boolean).sort();

    res.json({
      source: config.factoryApi.useMock ? "mock" : "api",
      summary,
      weightTrend,
      byDestination,
      byProduct,
      recentRecords,
      products,
      destinations,
    });
  } catch (err) {
    next(err);
  }
});
