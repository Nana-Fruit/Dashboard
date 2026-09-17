import { firebaseAuth } from "../firebase.js";
import { canViewOffice, canViewFactory, canEdit } from "./roles.js";

// Verifies the Firebase ID token and attaches req.user = { email, name, role }.
// `role` comes from a custom claim set by scripts/provision-users.js.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "ต้องเข้าสู่ระบบก่อน" });
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    if (!decoded.role) {
      return res.status(403).json({ error: "บัญชีนี้ยังไม่ได้กำหนดสิทธิ์ใช้งาน" });
    }
    req.user = { email: decoded.email, name: decoded.name || decoded.email, role: decoded.role };
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
