import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  esbuild: {
    options: {
      target: "esnext",
    },
  },
  publicAssets: [
    {
      dir: "public/assets",
      maxAge: 30 * 24 * 60 * 60,
    },
  ],
});
