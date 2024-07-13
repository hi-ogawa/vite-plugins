import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    next({
      plugins: [
        {
          name: "custom-config",
          config() {
            return {
              ssr: {
                external: ["@vercel/og"],
              },
            };
          },
        },
      ],
    }),
  ],
});
