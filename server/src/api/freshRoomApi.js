// Wrapper around the Factory-side upstream API for the fresh room. Same
// mock/real toggle pattern as factoryApi.js (dry-room).

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { createApiClient } from "../lib/apiClient.js";
import { getCached, setCached } from "../cache.js";

const MOCK_PATH = fileURLToPath(new URL("../mock/freshRoomBatches.json", import.meta.url));

const callApi = createApiClient(config.factoryApi);

async function loadMockBatches() {
  const raw = await readFile(MOCK_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Fetch ALL fresh-room batches (mock fixture or real API), cached briefly so
 * repeated dashboard loads don't hammer the source.
 * @returns {Promise<Array<object>>}
 */
export async function getAllFreshRoomBatches() {
  const cacheKey = `fresh-room-batches:${config.factoryApi.useMock ? "mock" : "api"}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  let all;
  if (config.factoryApi.useMock) {
    all = await loadMockBatches();
  } else {
    all = [];
    let cursor;
    do {
      const page = await callApi("/v1/fresh-room/batches", { limit: 100, cursor });
      all.push(...(page.data || []));
      cursor = page.pagination?.nextCursor || undefined;
    } while (cursor);
  }

  setCached(cacheKey, all, config.cacheTtlSeconds);
  return all;
}
