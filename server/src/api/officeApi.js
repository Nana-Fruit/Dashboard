// Wrapper around the Office-side upstream API (sales orders, etc). Same
// mock/real toggle + cache pattern as api/factoryApi.js.
//
// Upstream shape (GET /external/v1/sales-orders):
//   { id, po_number, customer_name, order_type: "domestic"|"international",
//     total_amount, opened_at, items: [{ sku, unit, quantity }] }
// mapSalesOrder() below normalizes that into the shape routes/office.js
// expects. total_amount is assumed to always be THB (no currency field
// upstream) and order_type only ever domestic/international today.
//
// Query params confirmed with upstream: from, to, order_type, page, limit.
// Pagination is page-based (no cursor) - we page through until a page comes
// back shorter than `limit`. from/to/order_type aren't passed here since
// getAllSalesOrders() needs the full order history in one list (the trend
// chart and top-spenders aggregation in routes/office.js both scan across
// months) - add them as params if a caller ever needs a bounded fetch.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { createApiClient } from "../lib/apiClient.js";
import { getCached, setCached } from "../cache.js";

const MOCK_PATH = fileURLToPath(new URL("../mock/salesOrders.json", import.meta.url));

export const callOfficeApi = createApiClient(config.officeApi);

async function loadMockOrders() {
  const raw = await readFile(MOCK_PATH, "utf8");
  return JSON.parse(raw);
}

function mapSalesOrder(raw) {
  return {
    orderId: raw.po_number,
    externalId: raw.id,
    orderDate: raw.opened_at,
    market: raw.order_type,
    customerName: raw.customer_name,
    amountTHB: raw.total_amount,
    items: (raw.items || []).map((i) => ({
      sku: i.sku,
      productName: i.product_name,
      unit: i.unit,
      quantity: i.quantity,
    })),
  };
}

/**
 * Fetch ALL sales orders (mock fixture or real API), normalized to the
 * internal shape, cached briefly so repeated dashboard loads don't hammer
 * the source.
 * @returns {Promise<Array<object>>}
 */
export async function getAllSalesOrders() {
  const cacheKey = `sales-orders:${config.officeApi.useMock ? "mock" : "api"}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  let raw;
  if (config.officeApi.useMock) {
    raw = await loadMockOrders();
  } else {
    raw = [];
    const limit = 100;
    let page = 1;
    let batch;
    do {
      const res = await callOfficeApi("/external/v1/sales-orders", { limit, page });
      batch = res.data || [];
      raw.push(...batch);
      page += 1;
    } while (batch.length === limit);
  }

  const mapped = raw.map(mapSalesOrder);
  setCached(cacheKey, mapped, config.cacheTtlSeconds);
  return mapped;
}
