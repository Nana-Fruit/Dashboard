import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { canViewOffice, canViewFactory, canEdit } from "./roles.js";

export function signToken(user) {
  return jwt.sign(
    { sub: user.email, name: user.name, role: user.role },
    config.auth.jwtSecret,
    { expiresIn: config.auth.tokenTtl }
  );
}

// Verifies the Bearer token and attaches req.user = { email, name, role }.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "ต้องเข้าสู่ระบบก่อน" });
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = { email: payload.sub, name: payload.name, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

const guard = (check, message) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "ต้องเข้าสู่ระบบก่อน" });
  if (!check(req.user.role)) return res.status(403).json({ error: message });
  next();
};

export const requireOffice = guard(canViewOffice, "ไม่มีสิทธิ์ดูข้อมูลฝั่ง Office");
export const requireFactory = guard(canViewFactory, "ไม่มีสิทธิ์ดูข้อมูลฝั่งโรงงาน");
export const requireEdit = guard(canEdit, "ไม่มีสิทธิ์แก้ไขข้อมูล (เฉพาะ Admin)");
