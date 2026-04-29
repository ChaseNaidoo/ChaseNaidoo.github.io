import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages: Settings → Deploy from branch `main`, folder `/docs` — not repo root.
  build: {
    outDir: "docs",
    emptyOutDir: true
  }
});
