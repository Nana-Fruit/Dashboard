import { Router } from "express";
import { config } from "../config.js";
import { getAllSortingRecords } from "../api/sortRoomApi.js";
import { requireAuth, requireFactory } from "../auth/middleware.js";

// Sorting room (ห้องคัด) detail view. Factory-side data, so same access rule.
export const sortingRoom = Router();
sortingRoom.use(requireAuth, requireFactory);

const api = sortingRoom;

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
const employeeCount = (r) => sum(r.employees, (e) => e.count);

function applyFilters(records, { product, from, to }) {
  return records.filter((r) => {
    if (product && r.productName !== product) return false;
    if (from && r.lotDate < from) return false;
    if (to && r.lotDate > to) return false;
    return true;
  });
}

// --- raw record list for the table (supports filters) -----------------
api.get("/records", async (req, res, next) => {
  try {
    const all = await getAllSortingRecords();
    const rows = applyFilters(all, req.query).sort((a, b) => b.lotDate.localeCompare(a.lotDate));
    res.json({ count: rows.length, records: rows });
  } catch (err) {
    next(err);
  }
});

// --- everything the dashboard needs in one call ----------------------
api.get("/dashboard", async (req, res, next) => {
  try {
    const all = await getAllSortingRecords();
    const records = applyFilters(all, req.query);

    const totalWeightKg = sum(records, (r) => r.totalWeightKg);
    const totalGradeWeightKg = sum(records, (r) => r.totalGradeWeightKg);
    const totalForeignWeightKg = sum(records, (r) => r.totalForeignWeightKg);

    const summary = {
      totalRecords: records.length,
      totalWeightKg: round(totalWeightKg),
      totalGradeWeightKg: round(totalGradeWeightKg),
      totalForeignWeightKg: round(totalForeignWeightKg),
      foreignPercent: totalWeightKg ? round((totalForeignWeightKg / totalWeightKg) * 100) : 0,
      totalWorkingHours: round(sum(records, (r) => r.totalWorkingHours)),
      avgEmployees: records.length ? round(sum(records, employeeCount) / records.length, 1) : 0,
    };

    // grade composition across the whole filtered set
    const gradeMap = new Map();
    for (const r of records) {
      for (const g of r.grades || []) {
        gradeMap.set(g.grade, (gradeMap.get(g.grade) || 0) + (g.weightKg || 0));
      }
    }
    const gradeLabels = [...gradeMap.keys()].sort();
    const gradeBreakdown = gradeLabels.map((grade) => ({ grade, weightKg: round(gradeMap.get(grade)) }));

    // per-product aggregates
    const byProductMap = new Map();
    for (const r of records) {
      const key = r.productName || "-";
      if (!byProductMap.has(key)) byProductMap.set(key, { product: key, records: 0, totalWeightKg: 0, foreignWeightKg: 0 });
      const g = byProductMap.get(key);
      g.records += 1;
      g.totalWeightKg += r.totalWeightKg || 0;
      g.foreignWeightKg += r.totalForeignWeightKg || 0;
    }
    const byProduct = [...byProductMap.values()]
      .map((g) => ({
        product: g.product,
        records: g.records,
        totalWeightKg: round(g.totalWeightKg),
        foreignPercent: g.totalWeightKg ? round((g.foreignWeightKg / g.totalWeightKg) * 100) : 0,
      }))
      .sort((a, b) => b.totalWeightKg - a.totalWeightKg);

    // grade trend by date, one row per date with a column per grade
    const trendMap = new Map();
    for (const r of records) {
      if (!trendMap.has(r.lotDate)) {
        trendMap.set(r.lotDate, Object.fromEntries([["date", r.lotDate], ...gradeLabels.map((g) => [g, 0])]));
      }
      const t = trendMap.get(r.lotDate);
      for (const g of r.grades || []) t[g.grade] = (t[g.grade] || 0) + (g.weightKg || 0);
    }
    const gradeTrend = [...trendMap.values()]
      .map((t) => ({ ...t, ...Object.fromEntries(gradeLabels.map((g) => [g, round(t[g] || 0)])) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentRecords = [...records]
      .sort((a, b) => b.lotDate.localeCompare(a.lotDate))
      .slice(0, 15)
      .map((r) => ({ ...r, employeeCount: employeeCount(r) }));

    const products = [...new Set(all.map((r) => r.productName))].filter(Boolean).sort();

    res.json({
      source: config.factoryApi.useMock ? "mock" : "api",
      summary,
      gradeLabels,
      gradeBreakdown,
      gradeTrend,
      byProduct,
      recentRecords,
      products,
    });
  } catch (err) {
    next(err);
  }
});
