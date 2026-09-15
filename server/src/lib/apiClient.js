// Generic HTTP client factory for upstream JSON APIs. Each side (factory,
// office, ...) creates its own client with its own baseUrl/apiKey via
// createApiClient() - no URL/auth shape is hardcoded here.

/**
 * @param {{ baseUrl: string, apiKey: string }} opts
 * @returns {(path: string, query?: Record<string,string|number|undefined>) => Promise<any>}
 */
export function createApiClient({ baseUrl, apiKey }) {
  return async function callApi(path, query = {}) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Upstream ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  };
}
