// One-time migration: seed Firestore settings/config from the legacy
// server/src/mock/config.json so existing sales targets / labor rates
// aren't lost when data/store.js switches off the local file.
// Safe to re-run - overwrites the Firestore doc with the file's contents.
// Run:  npm --workspace server run migrate:config

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set (check server/.env.development or server/.env)");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
const db = getFirestore();

const CONFIG_PATH = fileURLToPath(new URL("../src/mock/config.json", import.meta.url));
const data = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

await db.collection("settings").doc("config").set(data);
console.log("Seeded Firestore settings/config from mock/config.json:");
console.log(JSON.stringify(data, null, 2));
