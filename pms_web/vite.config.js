import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Force Vite to pre-bundle these together up front. Without this, MUI's
    // internal use of @emotion/styled (e.g. inside Popper) can end up resolved
    // from a second, later dependency-optimization pass that produces a
    // different module instance than the one @mui/material itself uses —
    // which is what causes "styled_default is not a function" at runtime.
    include: [
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/material/styles",
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5080", // PmsApi dev URL, adjust to your launchSettings.json
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
