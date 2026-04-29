import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Output at dist/ — set host "base directory" / publish folder to /dist (e.g. Cursor Cloud).
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
