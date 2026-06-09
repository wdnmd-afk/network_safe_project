import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

import { apiProxyTarget, webDevPort } from "./src/config/runtime";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: webDevPort,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
