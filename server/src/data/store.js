// Read/write the editable configuration (monthly sales targets, labor rates).
// Backed by a single Firestore document so edits by an Admin survive
// restarts/redeploys without a local disk. Swap for a proper collection
// layout if this ever grows beyond a couple of settings.

import { db } from "../firebase.js";

const configDoc = db.collection("settings").doc("config");

const DEFAULTS = { monthlySalesTargets: {}, laborRatePerHour: {} };

async function read() {
  const snap = await configDoc.get();
  return snap.exists ? { ...DEFAULTS, ...snap.data() } : { ...DEFAULTS };
}

async function write(data) {
  await configDoc.set(data);
  return data;
}

export const store = {
  getConfig: read,

  /** month = "YYYY-MM", target = { domestic, international } */
  async setMonthlyTarget(month, target) {
    const cfg = await read();
    cfg.monthlySalesTargets = cfg.monthlySalesTargets || {};
    cfg.monthlySalesTargets[month] = {
      domestic: Number(target.domestic) || 0,
      international: Number(target.international) || 0,
    };
    await write(cfg);
    return cfg.monthlySalesTargets[month];
  },

  async getMonthlyTarget(month) {
    const cfg = await read();
    return cfg.monthlySalesTargets?.[month] || { domestic: 0, international: 0 };
  },

  async getLaborRates() {
    return (await read()).laborRatePerHour || {};
  },

  async setLaborRates(rates) {
    const cfg = await read();
    cfg.laborRatePerHour = { ...cfg.laborRatePerHour, ...rates };
    await write(cfg);
    return cfg.laborRatePerHour;
  },
};
