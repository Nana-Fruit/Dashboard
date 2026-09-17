// Thin fetch wrapper. Attaches the Firebase ID token.
//
// Dev: VITE_API_BASE_URL is unset, so requests go to /api on the Vite origin
// and its proxy forwards them to the local Express server (see vite.config.js).
// Prod: the built client is on Firebase Hosting and the API is a separate
// origin (Railway), which can't be reached via a same-origin proxy - so
// VITE_API_BASE_URL must be set to that API's absolute URL at build time.

import { auth } from "./firebase.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(method, path, { params, body } = {}) {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString()
    : "";
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch(`${API_BASE_URL}/api${path}${qs}`, {
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
export const fetchMe = () => api.get("/auth/me");

export const getOfficeSummary = (month) => api.get("/office/summary", { month });
export const getOfficeOrders = (params) => api.get("/office/orders", params);
export const setOfficeTarget = (payload) => api.put("/office/target", payload);
export const getOnlineSummary = (month) => api.get("/office/online-summary", { month });

export const getFactorySummary = (params) => api.get("/factory/summary", params);
export const getFactoryRoom = (room, params) => api.get(`/factory/rooms/${room}`, params);
export const setFactoryLaborRates = (rates) => api.put("/factory/labor-rates", rates);

export const getDryRoomDashboard = (params) => api.get("/dry-room/dashboard", params);
export const getFreshRoomDashboard = (params) => api.get("/fresh-room/dashboard", params);
export const getSortingRoomDashboard = (params) => api.get("/sorting-room/dashboard", params);
export const getPackingRoomDashboard = (params) => api.get("/packing-room/dashboard", params);
