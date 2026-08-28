// Wrapper around the dry-room API. This is the ONLY file that knows the upstream
// URL shape and auth. Node 24 has global fetch built in.
//
// When config.useMock is true, everything below the fetch is skipped and the
// local fixture (src/mock/batches.json) is returned instead - no network calls.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getCached, setCached } from "./cache.js";

const MOCK_PATH = fileURLToPath(new URL("./mock/batches.json", import.meta.url));

async function loadMockBatches() {
  const raw = await readFile(MOCK_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Low-level call to one upstream endpoint.
 * @param {string} path  e.g. "/v1/dry-room/batches"
 * @param {Record<string,string|number>} [query]
 */
async function callApi(path, query = {}) {
  const url = new URL(path, config.externalApi.baseUrl);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-api-key": config.externalApi.apiKey,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Upstream ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch ALL dry-room batches (mock fixture or real API), with a short in-memory
 * cache so repeated dashboard loads don't hammer the source.
 * @param {{ status?: string }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function getAllBatches(opts = {}) {
  const cacheKey = `batches:${config.useMock ? "mock" : "api"}:${opts.status || "all"}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  let all;
  if (config.useMock) {
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
