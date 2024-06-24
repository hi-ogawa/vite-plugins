import { vitePluginReactServerNext } from "@hiogawa/react-server/next/plugin";
import react from "@vitejs/plugin-react";
import { type AliasOptions, defineConfig } from "vite";

const nextAlias: AliasOptions = [
  {
    find: /^next(\/.*)?/,
    replacement: "@hiogawa/react-server/next/compat$1",
  },
];

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: nextAlias,
  },
  plugins: [
    react(),
    vitePluginReactServerNext({
      plugins: [
        {
          name: "next-compat-alias",
          config(_config, _env) {
            return {
              resolve: {
                alias: nextAlias,
              },
            };
          },
        },
      ],
    }),
  ],
});
