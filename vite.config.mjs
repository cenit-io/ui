import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    host: "0.0.0.0",
    port: 3002,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3002,
    strictPort: true,
  },
  build: {
    outDir: "build",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
