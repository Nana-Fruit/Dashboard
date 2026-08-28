// Generates server/src/auth/users.json with bcrypt-hashed passwords.
// Run:  npm --workspace server run seed:users
//
// Edit the EMPLOYEES list below to add/remove people or change roles, then
// re-run. Passwords here are DEV defaults - change them for real use.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "auth", "users.json");

// role: audit | admin | office | factory
const EMPLOYEES = [
  { email: "admin@nanafruit.com",   name: "ผู้ดูแลระบบ",      role: "admin",   password: "admin1234" },
  { email: "audit@nanafruit.com",   name: "ผู้ตรวจสอบ",       role: "audit",   password: "audit1234" },
  { email: "office@nanafruit.com",  name: "ทีม Office",       role: "office",  password: "office1234" },
  { email: "factory@nanafruit.com", name: "ทีมโรงงาน",        role: "factory", password: "factory1234" },
  { email: "da@nanafruit.com",      name: "Da",               role: "admin",   password: "da123456" },
];

const users = EMPLOYEES.map((e) => ({
  email: e.email.trim().toLowerCase(),
  name: e.name,
  role: e.role,
  passwordHash: bcrypt.hashSync(e.password, 10),
}));

writeFileSync(OUT, JSON.stringify(users, null, 2) + "\n");
console.log(`Wrote ${users.length} users to ${OUT}`);
console.table(EMPLOYEES.map(({ email, role, password }) => ({ email, role, password })));
