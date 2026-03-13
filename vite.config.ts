import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // allow access from Docker
    port: 5173,
    watch: {
      usePolling: true // important for Docker file change detection
    }
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});