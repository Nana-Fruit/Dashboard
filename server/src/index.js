import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { auth } from "./auth/routes.js";
import { office } from "./routes/office.js";
import { factory } from "./routes/factory.js";
import { dryRoom } from "./routes/dryRoom.js";

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// public
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, source: config.useMock ? "mock" : "api" });
});

app.use("/api/auth", auth);
app.use("/api/office", office);       // audit | admin | office
app.use("/api/factory", factory);     // audit | admin | factory
app.use("/api/dry-room", dryRoom);    // audit | admin | factory

// Central error handler
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`API server listening on http://localhost:${config.port}`);
});
