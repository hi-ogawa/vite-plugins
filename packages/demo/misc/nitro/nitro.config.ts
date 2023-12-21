import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  esbuild: {
    options: {
      target: "esnext",
    },
  },
  publicAssets: [
    {
      baseURL: "assets",
      dir: "public/assets",
      maxAge: 31536000,
    },
  ],
});
