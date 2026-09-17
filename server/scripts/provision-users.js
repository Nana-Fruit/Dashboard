// Creates/updates the employee accounts directly in Firebase Auth and sets
// each one's role as a custom claim (read by auth/middleware.js).
// Run:  npm --workspace server run provision:users
//
// Edit the EMPLOYEES list below to add/remove people or change roles, then
// re-run - it's safe to run repeatedly (updates existing accounts by email).
// Requires FIREBASE_SERVICE_ACCOUNT_KEY in the environment (see server/.env).

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set (check server/.env.development or server/.env)");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
const auth = getAuth();

// role: audit | admin | office | factory
const EMPLOYEES = [
  { email: "admin@nanafruit.com",   name: "ผู้ดูแลระบบ", role: "admin",   password: "admin1234" },
  { email: "audit@nanafruit.com",   name: "ผู้ตรวจสอบ",  role: "audit",   password: "audit1234" },
  { email: "office@nanafruit.com",  name: "ทีม Office",  role: "office",  password: "office1234" },
  { email: "factory@nanafruit.com", name: "ทีมโรงงาน",   role: "factory", password: "factory1234" },
  { email: "da@nanafruit.com",      name: "Da",          role: "admin",   password: "da123456" },
];

for (const e of EMPLOYEES) {
  const email = e.email.trim().toLowerCase();
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { displayName: e.name, password: e.password });
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({ email, displayName: e.name, password: e.password });
  }
  await auth.setCustomUserClaims(user.uid, { role: e.role });
  console.log(`${email} -> role=${e.role} (uid=${user.uid})`);
}

console.log(`Provisioned ${EMPLOYEES.length} users.`);
console.table(EMPLOYEES.map(({ email, role, password }) => ({ email, role, password })));
