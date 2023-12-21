import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  publicAssets: [
    {
      baseURL: "assets",
      dir: "public/assets",
      maxAge: 31536000,
    },
  ],
  rollupConfig: {
    // silence warning by "use client" in react-query https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
    onwarn(warning, defaultHandler) {
      if (
        warning.code === "MODULE_LEVEL_DIRECTIVE" &&
        warning.message.includes(`"use client"`)
      ) {
        return;
      }
      defaultHandler(warning);
    },
  },
});
