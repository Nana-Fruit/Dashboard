import { Router } from "express";
import { config } from "../config.js";
import { getAllFreshRoomBatches } from "../api/freshRoomApi.js";
import { requireAuth, requireFactory } from "../auth/middleware.js";

// Fresh room (ห้องสด) detail view. Factory-side data, so same access rule.
export const freshRoom = Router();
freshRoom.use(requireAuth, requireFactory);

const api = freshRoom;

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
const employeeCount = (b) => sum(b.employees, (e) => e.count);

function applyFilters(batches, { product, from, to }) {
  return batches.filter((b) => {
    if (product && b.productName !== product) return false;
    if (from && b.lotDate < from) return false;
    if (to && b.lotDate > to) return false;
    return true;
  });
}

// --- raw batch list for the table (supports filters) -----------------
api.get("/batches", async (req, res, next) => {
  try {
    const all = await getAllFreshRoomBatches();
    const rows = applyFilters(all, req.query).sort((a, b) => b.lotDate.localeCompare(a.lotDate));
    res.json({ count: rows.length, batches: rows });
  } catch (err) {
    next(err);
  }
});

// --- everything the dashboard needs in one call ----------------------
api.get("/dashboard", async (req, res, next) => {
  try {
    const all = await getAllFreshRoomBatches();
    const batches = applyFilters(all, req.query);

    const totalInput = sum(batches, (b) => b.inputWeightKg);
    const totalOutput = sum(batches, (b) => b.outputWeightKg);

    const summary = {
      totalBatches: batches.length,
      totalInputKg: round(totalInput),
      totalOutputKg: round(totalOutput),
      overallYieldPercent: totalInput ? round((totalOutput / totalInput) * 100) : 0,
      totalWorkingHours: round(sum(batches, (b) => b.totalWorkingHours)),
      avgEmployees: batches.length ? round(sum(batches, employeeCount) / batches.length, 1) : 0,
    };

    // per-product aggregates
    const byProductMap = new Map();
    for (const b of batches) {
      const key = b.productName || "-";
      if (!byProductMap.has(key)) byProductMap.set(key, { product: key, batches: 0, inputKg: 0, outputKg: 0 });
      const g = byProductMap.get(key);
      g.batches += 1;
      g.inputKg += b.inputWeightKg || 0;
      g.outputKg += b.outputWeightKg || 0;
    }
    const byProduct = [...byProductMap.values()]
      .map((g) => ({
        product: g.product,
        batches: g.batches,
        inputKg: round(g.inputKg),
        outputKg: round(g.outputKg),
        yieldPercent: g.inputKg ? round((g.outputKg / g.inputKg) * 100) : 0,
      }))
      .sort((a, b) => b.inputKg - a.inputKg);

    // yield trend: one point per lotDate, weighted average
    const trendMap = new Map();
    for (const b of batches) {
      if (!trendMap.has(b.lotDate)) trendMap.set(b.lotDate, { date: b.lotDate, inputKg: 0, outputKg: 0 });
      const t = trendMap.get(b.lotDate);
      t.inputKg += b.inputWeightKg || 0;
      t.outputKg += b.outputWeightKg || 0;
    }
    const yieldTrend = [...trendMap.values()]
      .map((t) => ({
        date: t.date,
        yieldPercent: t.inputKg ? round((t.outputKg / t.inputKg) * 100) : 0,
        inputKg: round(t.inputKg),
        outputKg: round(t.outputKg),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentBatches = [...batches]
      .sort((a, b) => b.lotDate.localeCompare(a.lotDate))
      .slice(0, 15)
      .map((b) => ({ ...b, employeeCount: employeeCount(b) }));

    const products = [...new Set(all.map((b) => b.productName))].filter(Boolean).sort();

    res.json({ source: config.factoryApi.useMock ? "mock" : "api", summary, byProduct, yieldTrend, recentBatches, products });
  } catch (err) {
    next(err);
  }
});
