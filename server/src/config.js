// Central place to read environment variables so the rest of the code
// never touches process.env directly.

// USE_MOCK_FACTORY / USE_MOCK_OFFICE = true  -> serve local fixtures in src/mock/, no API calls.
//                                     = false -> hit that side's real API.
// Kept independent so e.g. Factory can go live while Office is still mocked.
const useMockFactory = String(process.env.USE_MOCK_FACTORY).toLowerCase() === "true";
const useMockOffice = String(process.env.USE_MOCK_OFFICE).toLowerCase() === "true";

export const config = {
  // Railway (and most PaaS hosts) assign the port via PORT at runtime and
  // expect the app to listen on it. SERVER_PORT remains the override for
  // local dev, where a generic PORT env var might otherwise be aimed at
  // the frontend instead.
  port: Number(process.env.PORT || process.env.SERVER_PORT) || 4000,
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
  firebase: {
    // Service account JSON, as a single-line string. See server/.env.example.
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "",
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
if (!config.firebase.serviceAccountKey) {
  console.warn("[config] FIREBASE_SERVICE_ACCOUNT_KEY is not set - auth and config storage will fail. Set it in server/.env.");
}
