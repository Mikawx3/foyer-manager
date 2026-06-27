import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolveApiPort } from "./vite-api-port";

export default defineConfig(({ mode }) => {
  const apiPort = resolveApiPort(mode);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: ["foyer", "foyer.local", "localhost"],
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
