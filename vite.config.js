import { defineConfig } from "vite";
import { ocrAssets } from "./build/ocr-assets.js";
export default defineConfig({
  plugins: [ocrAssets()],
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
  preview: { proxy: { "/api": "http://127.0.0.1:3001" } },
});
