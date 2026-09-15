// Wrapper around the Factory-side upstream API (dry-room, etc). This is the
// ONLY file that knows the upstream URL shape and auth for the Factory side.
// Node 24 has global fetch built in.
//
// When config.factoryApi.useMock is true, everything below the fetch is
// skipped and the local fixture (src/mock/batches.json) is returned instead
// - no network calls.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { createApiClient } from "../lib/apiClient.js";
import { getCached, setCached } from "../cache.js";

const MOCK_PATH = fileURLToPath(new URL("../mock/batches.json", import.meta.url));

const callApi = createApiClient(config.factoryApi);

async function loadMockBatches() {
  const raw = await readFile(MOCK_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Fetch ALL dry-room batches (mock fixture or real API), with a short in-memory
 * cache so repeated dashboard loads don't hammer the source.
 * @param {{ status?: string }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function getAllBatches(opts = {}) {
  const cacheKey = `batches:${config.factoryApi.useMock ? "mock" : "api"}:${opts.status || "all"}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  let all;
  if (config.factoryApi.useMock) {
    all = await loadMockBatches();
    if (opts.status) all = all.filter((b) => b.status === opts.status);
  } else {
    all = [];
    let cursor;
    do {
      const page = await callApi("/v1/dry-room/batches", {
        limit: 100,
        status: opts.status,
        cursor,
      });
      all.push(...(page.data || []));
      cursor = page.pagination?.nextCursor || undefined;
    } while (cursor);
  }

  setCached(cacheKey, all, config.cacheTtlSeconds);
  return all;
}
