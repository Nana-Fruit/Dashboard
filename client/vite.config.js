import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, calls to /api/* are proxied to the Express server on :4000,
// so the browser only ever talks to the Vite origin (no CORS headaches).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
