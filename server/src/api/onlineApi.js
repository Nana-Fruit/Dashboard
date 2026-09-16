// Online-channel sales orders (TikTok Shop / Shopee / Lazada / LINE OA).
// No upstream API exists yet, so this only ever serves the mock fixture -
// same mapper pattern as api/officeApi.js, ready to grow a real-API branch
// once a channel data source is wired up.
//
// Mock shape (scripts/generate-mock-online.js):
//   { id, order_no, channel, opened_at, items: [{ sku, product_name, quantity }],
//     free_items: [{ sku, product_name, quantity }], promotion_name,
//     gross_amount, net_amount }

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { getCached, setCached } from "../cache.js";

const MOCK_PATH = fileURLToPath(new URL("../mock/onlineOrders.json", import.meta.url));

function mapOnlineOrder(raw) {
  return {
    orderId: raw.order_no,
    externalId: raw.id,
    orderDate: raw.opened_at,
    channel: raw.channel,
    items: (raw.items || []).map((i) => ({ sku: i.sku, productName: i.product_name, quantity: i.quantity })),
    freeItems: (raw.free_items || []).map((i) => ({ sku: i.sku, productName: i.product_name, quantity: i.quantity })),
    promotionName: raw.promotion_name || null,
    grossAmountTHB: raw.gross_amount,
    netAmountTHB: raw.net_amount,
  };
}

/**
 * Fetch ALL online-channel orders (mock fixture only, for now), normalized
 * to the internal shape, cached briefly like getAllSalesOrders().
 * @returns {Promise<Array<object>>}
 */
export async function getAllOnlineOrders() {
  const cacheKey = "online-orders:mock";
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const raw = JSON.parse(await readFile(MOCK_PATH, "utf8"));
  const mapped = raw.map(mapOnlineOrder);
  setCached(cacheKey, mapped, config.cacheTtlSeconds);
  return mapped;
}
