import { Router } from "express";
import { verifyCredentials } from "./users.js";
import { signToken, requireAuth } from "./middleware.js";
import { permissionsFor } from "./roles.js";

export const auth = Router();

// POST /api/auth/login  { email, password } -> { token, user }
auth.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }
  const user = await verifyCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  res.json({
    token: signToken(user),
    user: { email: user.email, name: user.name, ...permissionsFor(user.role) },
  });
});

// GET /api/auth/me -> current user + permissions
auth.get("/me", requireAuth, (req, res) => {
  res.json({
    user: { email: req.user.email, name: req.user.name, ...permissionsFor(req.user.role) },
  });
});
