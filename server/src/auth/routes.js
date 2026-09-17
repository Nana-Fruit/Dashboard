import { Router } from "express";
import { requireAuth } from "./middleware.js";
import { permissionsFor } from "./roles.js";

export const auth = Router();

// GET /api/auth/me -> current user + permissions (client signs in directly
// with the Firebase Auth SDK and sends the resulting ID token as Bearer)
auth.get("/me", requireAuth, (req, res) => {
  res.json({
    user: { email: req.user.email, name: req.user.name, ...permissionsFor(req.user.role) },
  });
});
