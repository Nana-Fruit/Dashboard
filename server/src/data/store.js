// Read/write the editable configuration (monthly sales targets, labor rates).
// Backed by a JSON file so edits by an Admin survive a restart. Swap for a DB
// when you outgrow a single file.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = fileURLToPath(new URL("../mock/config.json", import.meta.url));

function read() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

function write(data) {
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + "\n");
  return data;
}

export const store = {
  getConfig: read,

  /** month = "YYYY-MM", target = { domestic, international } */
  setMonthlyTarget(month, target) {
    const cfg = read();
    cfg.monthlySalesTargets = cfg.monthlySalesTargets || {};
    cfg.monthlySalesTargets[month] = {
      domestic: Number(target.domestic) || 0,
      international: Number(target.international) || 0,
    };
    write(cfg);
    return cfg.monthlySalesTargets[month];
  },

  getMonthlyTarget(month) {
    const cfg = read();
    return cfg.monthlySalesTargets?.[month] || { domestic: 0, international: 0 };
  },

  getLaborRates() {
    return read().laborRatePerHour || {};
  },

  setLaborRates(rates) {
    const cfg = read();
    cfg.laborRatePerHour = { ...cfg.laborRatePerHour, ...rates };
    write(cfg);
    return cfg.laborRatePerHour;
  },
};
