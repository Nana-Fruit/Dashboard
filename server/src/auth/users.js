// Loads the employee list from src/auth/users.json (created by
// `npm --workspace server run seed:users`). In a real deployment this would be
// a database or your HR/SSO directory.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const USERS_PATH = fileURLToPath(new URL("./users.json", import.meta.url));

let users = [];
try {
  users = JSON.parse(readFileSync(USERS_PATH, "utf8"));
} catch {
  console.warn("[auth] src/auth/users.json not found - run: npm --workspace server run seed:users");
}

const normalize = (email) => String(email || "").trim().toLowerCase();

export function findUserByEmail(email) {
  return users.find((u) => u.email === normalize(email));
}

export async function verifyCredentials(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { email: user.email, name: user.name, role: user.role };
}
