import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

export default defineConfig({
  clearScreen: false,
  optimizeDeps: {
    // force: true,
  },
  ssr: {
    resolve: {
      conditions: ["react-server"],
    },

    // no external to load everything with react-server condition
    noExternal: true,
    // noExternal: ["react", "react-dom", "react-server-dom-webpack"],

    optimizeDeps: {
      // cjs deps
      include: [
        "react",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server.edge",
        "react-server-dom-webpack/client.edge",
        "react-server-dom-webpack/server.edge",
      ],
    },
  },
  plugins: [
    // react(),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
    }),
  ],
});
