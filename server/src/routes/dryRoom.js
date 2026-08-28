import { Router } from "express";
import { config } from "../config.js";
import { getAllBatches } from "../externalApi.js";
import { requireAuth, requireFactory } from "../auth/middleware.js";

// Dry room (ห้องอบ) detail view. Factory-side data, so same access rule.
export const dryRoom = Router();
dryRoom.use(requireAuth, requireFactory);

const api = dryRoom;

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);

function applyFilters(batches, { status, product, from, to }) {
  return batches.filter((b) => {
    if (status && b.status !== status) return false;
    if (product && b.productName !== product) return false;
    if (from && b.lotDate < from) return false;
    if (to && b.lotDate > to) return false;
    return true;
  });
}

// --- raw batch list for the table (supports filters) -----------------
api.get("/batches", async (req, res, next) => {
  try {
    const all = await getAllBatches();
    const rows = applyFilters(all, req.query).sort((a, b) =>
      b.lotDate.localeCompare(a.lotDate)
    );
    res.json({ count: rows.length, batches: rows });
  } catch (err) {
    next(err);
  }
});

// --- everything the dashboard needs in one call ----------------------
api.get("/dashboard", async (req, res, next) => {
  try {
    const all = await getAllBatches();
    const batches = applyFilters(all, req.query);

    const done = batches.filter((b) => b.status === "dry_done");
    const processing = batches.filter((b) => b.status === "dry_processing");

    const totalInput = sum(batches, (b) => b.inputWeightKg);
    const totalOutput = sum(batches, (b) => b.totalOutputWeightKg);
    const doneInput = sum(done, (b) => b.inputWeightKg);
    const doneOutput = sum(done, (b) => b.totalOutputWeightKg);

    const summary = {
      totalBatches: batches.length,
      processingBatches: processing.length,
      doneBatches: done.length,
      totalInputKg: round(totalInput),
      totalOutputKg: round(totalOutput),
      overallYieldPercent: doneInput ? round((doneOutput / doneInput) * 100) : 0,
      totalWorkingHours: round(sum(batches, (b) => b.totalWorkingHours)),
    };

    // per-product aggregates (finished batches only for yield)
    const byProductMap = new Map();
    for (const b of batches) {
      const key = b.productName || "-";
      if (!byProductMap.has(key)) {
        byProductMap.set(key, { product: key, batches: 0, inputKg: 0, outputKg: 0, doneInputKg: 0, doneOutputKg: 0 });
      }
      const g = byProductMap.get(key);
      g.batches += 1;
      g.inputKg += b.inputWeightKg || 0;
      g.outputKg += b.totalOutputWeightKg || 0;
      if (b.status === "dry_done") {
        g.doneInputKg += b.inputWeightKg || 0;
        g.doneOutputKg += b.totalOutputWeightKg || 0;
      }
    }
    const byProduct = [...byProductMap.values()]
      .map((g) => ({
        product: g.product,
        batches: g.batches,
        inputKg: round(g.inputKg),
        outputKg: round(g.outputKg),
        yieldPercent: g.doneInputKg ? round((g.doneOutputKg / g.doneInputKg) * 100) : 0,
      }))
      .sort((a, b) => b.inputKg - a.inputKg);

    // yield trend: one point per lotDate (finished batches, weighted average)
    const trendMap = new Map();
    for (const b of done) {
      if (!trendMap.has(b.lotDate)) trendMap.set(b.lotDate, { date: b.lotDate, inputKg: 0, outputKg: 0 });
      const t = trendMap.get(b.lotDate);
      t.inputKg += b.inputWeightKg || 0;
      t.outputKg += b.totalOutputWeightKg || 0;
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
      .slice(0, 15);

    // filter options for the UI
    const products = [...new Set(all.map((b) => b.productName))].filter(Boolean).sort();

    res.json({ source: config.useMock ? "mock" : "api", summary, byProduct, yieldTrend, recentBatches, products });
  } catch (err) {
    next(err);
  }
});
