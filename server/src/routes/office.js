import { Router } from "express";
import { requireAuth, requireOffice, requireEdit } from "../auth/middleware.js";
import { store } from "../data/store.js";
import { config } from "../config.js";
import { getAllSalesOrders } from "../api/officeApi.js";
import { getAllOnlineOrders } from "../api/onlineApi.js";

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0);
const monthOf = (isoDate) => isoDate.slice(0, 7);
const thisMonth = () => new Date().toISOString().slice(0, 7);

function topBy(orders, keyFn, limit = 5) {
  const map = new Map();
  for (const o of orders) {
    const k = keyFn(o);
    map.set(k, (map.get(k) || 0) + o.amountTHB);
  }
  return [...map.entries()]
    .map(([name, amountTHB]) => ({ name, amountTHB: round(amountTHB) }))
    .sort((a, b) => b.amountTHB - a.amountTHB)
    .slice(0, limit);
}

// Ranks products by total quantity sold - orders carry a total amount, not a
// per-item price, so quantity (not revenue) is the only meaningful metric.
function topProductsBy(orders, limit = 5) {
  const map = new Map();
  for (const o of orders) {
    for (const item of o.items || []) {
      const cur = map.get(item.sku) || {
        sku: item.sku,
        name: item.productName || item.sku,
        unit: item.unit,
        quantity: 0,
      };
      cur.quantity += item.quantity || 0;
      map.set(item.sku, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export const office = Router();
office.use(requireAuth, requireOffice);

// --- monthly KPI + breakdowns ---------------------------------------
office.get("/summary", async (req, res, next) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || "") ? req.query.month : thisMonth();
    const all = await getAllSalesOrders();
    const monthOrders = all.filter((o) => monthOf(o.orderDate) === month);

    const domestic = monthOrders.filter((o) => o.market === "domestic");
    const international = monthOrders.filter((o) => o.market === "international");

    const target = store.getMonthlyTarget(month);
    const actualDom = round(sum(domestic, (o) => o.amountTHB));
    const actualIntl = round(sum(international, (o) => o.amountTHB));
    const targetTotal = (target.domestic || 0) + (target.international || 0);
    const actualTotal = actualDom + actualIntl;

    const kpi = (actual, tgt) => ({
      actual: round(actual),
      target: round(tgt),
      achievedPercent: tgt ? round((actual / tgt) * 100, 1) : 0,
      remaining: round(Math.max(tgt - actual, 0)),
    });

    // revenue per month for the trend chart (last 6 months up to selected)
    const trendMap = new Map();
    for (const o of all) {
      const m = monthOf(o.orderDate);
      if (!trendMap.has(m)) trendMap.set(m, { month: m, domestic: 0, international: 0 });
      trendMap.get(m)[o.market] += o.amountTHB;
    }
    const monthlyTrend = [...trendMap.values()]
      .map((t) => ({ month: t.month, domestic: round(t.domestic), international: round(t.international), total: round(t.domestic + t.international) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      source: config.officeApi.useMock ? "mock" : "api",
      month,
      editable: req.user.role === "admin",
      overall: kpi(actualTotal, targetTotal),
      byMarket: {
        domestic: kpi(actualDom, target.domestic || 0),
        international: kpi(actualIntl, target.international || 0),
      },
      orderCount: { domestic: domestic.length, international: international.length },
      topSpenders: {
        domestic: topBy(domestic, (o) => o.customerName),
        international: topBy(international, (o) => o.customerName),
      },
      topProducts: topProductsBy(monthOrders),
      monthlyTrend,
    });
  } catch (err) {
    next(err);
  }
});

// --- raw order list ------------------------------------------------
office.get("/orders", async (req, res, next) => {
  try {
    const { month, market } = req.query;
    let rows = await getAllSalesOrders();
    if (/^\d{4}-\d{2}$/.test(month || "")) rows = rows.filter((o) => monthOf(o.orderDate) === month);
    if (market === "domestic" || market === "international") rows = rows.filter((o) => o.market === market);
    rows.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    res.json({ count: rows.length, totalAmountTHB: round(sum(rows, (o) => o.amountTHB)), orders: rows });
  } catch (err) {
    next(err);
  }
});

// --- online-channel summary (TikTok Shop / Shopee / Lazada / LINE OA) ---
office.get("/online-summary", async (req, res, next) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || "") ? req.query.month : thisMonth();
    const all = await getAllOnlineOrders();
    const monthOrders = all.filter((o) => monthOf(o.orderDate) === month);

    const byChannel = new Map();
    for (const o of monthOrders) {
      const cur = byChannel.get(o.channel) || { channel: o.channel, orders: 0, grossAmountTHB: 0, netAmountTHB: 0 };
      cur.orders += 1;
      cur.grossAmountTHB += o.grossAmountTHB;
      cur.netAmountTHB += o.netAmountTHB;
      byChannel.set(o.channel, cur);
    }
    // Ranked by net revenue (after channel fees) - the actual money received.
    const channels = [...byChannel.values()]
      .map((c) => ({ ...c, grossAmountTHB: round(c.grossAmountTHB), netAmountTHB: round(c.netAmountTHB) }))
      .sort((a, b) => b.netAmountTHB - a.netAmountTHB);

    res.json({ source: "mock", month, channels });
  } catch (err) {
    next(err);
  }
});

// --- set monthly target (Admin only) -----------------------------
office.put("/target", requireEdit, (req, res) => {
  const { month, domestic, international } = req.body || {};
  if (!/^\d{4}-\d{2}$/.test(month || "")) {
    return res.status(400).json({ error: "month ต้องเป็นรูปแบบ YYYY-MM" });
  }
  const saved = store.setMonthlyTarget(month, { domestic, international });
  res.json({ month, target: saved });
});
