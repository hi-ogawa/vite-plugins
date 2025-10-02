import fullstack from "@hiogawa/vite-plugin-fullstack";
// import inspect from "vite-plugin-inspect";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    vue(),
    devtoolsJson(),
    fullstack(),
    // TODO: upstream?
    // Vite client HMR requests scoped css link stylesheet with `lang.css=` instead of `lang.css`,
    // which seems to cause response to be `text/javascript` even though response text is raw css.
    {
      name: "fix-vue-scoped-css-hmr",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.headers.accept?.includes("text/css") &&
            req.url?.includes("&lang.css=")
          ) {
            req.url = req.url.replace("&lang.css=", "?lang.css");
          }
          next();
        });
      },
    },
  ],
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
        rollupOptions: {
          input: {
            index: "./src/framework/entry.client.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        emitAssets: true,
        rollupOptions: {
          input: {
            index: "./src/framework/entry.server.tsx",
          },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
