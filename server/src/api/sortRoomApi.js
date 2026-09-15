// Wrapper around the Factory-side upstream API for the sort-room, which
// covers both the sorting and packing steps. Same mock/real toggle pattern
// as factoryApi.js (dry-room).

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { createApiClient } from "../lib/apiClient.js";
import { getCached, setCached } from "../cache.js";

const SORTING_MOCK_PATH = fileURLToPath(new URL("../mock/sortingRecords.json", import.meta.url));
const PACKING_MOCK_PATH = fileURLToPath(new URL("../mock/packingRecords.json", import.meta.url));

const callApi = createApiClient(config.factoryApi);

async function loadMock(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function getAll(cacheKey, mockPath, upstreamPath) {
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  let all;
  if (config.factoryApi.useMock) {
    all = await loadMock(mockPath);
  } else {
    all = [];
    let cursor;
    do {
      const page = await callApi(upstreamPath, { limit: 100, cursor });
      all.push(...(page.data || []));
      cursor = page.pagination?.nextCursor || undefined;
    } while (cursor);
  }

  setCached(cacheKey, all, config.cacheTtlSeconds);
  return all;
}

/** Fetch ALL sorting records (mock fixture or real API). @returns {Promise<Array<object>>} */
export async function getAllSortingRecords() {
  return getAll(
    `sort-room-sorting:${config.factoryApi.useMock ? "mock" : "api"}`,
    SORTING_MOCK_PATH,
    "/v1/sort-room/sorting/records"
  );
}

/** Fetch ALL packing records (mock fixture or real API). @returns {Promise<Array<object>>} */
export async function getAllPackingRecords() {
  return getAll(
    `sort-room-packing:${config.factoryApi.useMock ? "mock" : "api"}`,
    PACKING_MOCK_PATH,
    "/v1/sort-room/packing/records"
  );
}
