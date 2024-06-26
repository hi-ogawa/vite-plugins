// @ts-nocheck
// TODO: this one needs to be `next/vite` when used outside of monorepo
import next from "@hiogawa/react-server-next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [next()],
});
