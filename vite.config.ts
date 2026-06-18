import { defineConfig } from "vite";
import react from "@vitejs/react-refresh";

export default defineConfig({
  base: "/perfect-print-creator/",
  server: {
    host: "::",
    port: 8080,
  },
});
