import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Forward /api calls to the Express server so we avoid CORS issues in development
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:3001" } },
});
