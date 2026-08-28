// Thin fetch wrapper. Attaches the JWT and routes all traffic through /api
// (Vite proxies that to the Express server in dev).

const TOKEN_KEY = "dashboard.token";

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

async function request(method, path, { params, body } = {}) {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString()
    : "";
  const token = tokenStore.get();
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, params) => request("GET", path, { params }),
  post: (path, body) => request("POST", path, { body }),
  put: (path, body) => request("PUT", path, { body }),
};

// endpoints
export const login = (email, password) => api.post("/auth/login", { email, password });
export const fetchMe = () => api.get("/auth/me");

export const getOfficeSummary = (month) => api.get("/office/summary", { month });
export const getOfficeOrders = (params) => api.get("/office/orders", params);
export const setOfficeTarget = (payload) => api.put("/office/target", payload);

export const getFactorySummary = (params) => api.get("/factory/summary", params);
export const getFactoryRoom = (room, params) => api.get(`/factory/rooms/${room}`, params);
export const setFactoryLaborRates = (rates) => api.put("/factory/labor-rates", rates);

export const getDryRoomDashboard = (params) => api.get("/dry-room/dashboard", params);
