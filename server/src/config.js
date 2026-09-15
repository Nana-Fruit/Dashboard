// Central place to read environment variables so the rest of the code
// never touches process.env directly.

// USE_MOCK_FACTORY / USE_MOCK_OFFICE = true  -> serve local fixtures in src/mock/, no API calls.
//                                     = false -> hit that side's real API.
// Kept independent so e.g. Factory can go live while Office is still mocked.
const useMockFactory = String(process.env.USE_MOCK_FACTORY).toLowerCase() === "true";
const useMockOffice = String(process.env.USE_MOCK_OFFICE).toLowerCase() === "true";

export const config = {
  // SERVER_PORT (not PORT) so tooling that injects a generic PORT env var
  // for the frontend can't accidentally steal the API server's port.
  port: Number(process.env.SERVER_PORT) || 4000,
  factoryApi: {
    useMock: useMockFactory,
    baseUrl: process.env.FACTORY_API_BASE_URL || "",
    apiKey: process.env.FACTORY_API_KEY || "",
  },
  officeApi: {
    useMock: useMockOffice,
    baseUrl: process.env.OFFICE_API_BASE_URL || "",
    apiKey: process.env.OFFICE_API_KEY || "",
  },
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 60,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
    tokenTtl: process.env.TOKEN_TTL || "12h",
  },
};

console.log(`[config] factory data source: ${useMockFactory ? "MOCK fixtures" : "real API"}`);
console.log(`[config] office data source: ${useMockOffice ? "MOCK fixtures" : "real API"}`);

if (!useMockFactory && !config.factoryApi.baseUrl) {
  console.warn("[config] FACTORY_API_BASE_URL is not set - real Factory API calls will fail. Set USE_MOCK_FACTORY=true to use fixtures.");
}
if (!useMockOffice && !config.officeApi.baseUrl) {
  console.warn("[config] OFFICE_API_BASE_URL is not set - real Office API calls will fail. Set USE_MOCK_OFFICE=true to use fixtures.");
}
if (config.auth.jwtSecret === "dev-only-insecure-secret-change-me") {
  console.warn("[config] JWT_SECRET is not set - using an insecure dev default. Set it in server/.env before deploying.");
}
