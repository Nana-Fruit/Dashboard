// Central place to read environment variables so the rest of the code
// never touches process.env directly.

// USE_MOCK=true  -> serve local fixtures in src/mock/, no API calls.
// USE_MOCK=false -> hit the real APIs.
const useMock = String(process.env.USE_MOCK).toLowerCase() === "true";

export const config = {
  // SERVER_PORT (not PORT) so tooling that injects a generic PORT env var
  // for the frontend can't accidentally steal the API server's port.
  port: Number(process.env.SERVER_PORT) || 4000,
  useMock,
  externalApi: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL || "",
    apiKey: process.env.EXTERNAL_API_KEY || "",
  },
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 60,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
    tokenTtl: process.env.TOKEN_TTL || "12h",
  },
};

console.log(`[config] data source: ${useMock ? "MOCK fixtures" : "real API"}`);

if (!useMock && !config.externalApi.baseUrl) {
  console.warn("[config] EXTERNAL_API_BASE_URL is not set - real API calls will fail. Set USE_MOCK=true to use fixtures.");
}
if (config.auth.jwtSecret === "dev-only-insecure-secret-change-me") {
  console.warn("[config] JWT_SECRET is not set - using an insecure dev default. Set it in server/.env before deploying.");
}
