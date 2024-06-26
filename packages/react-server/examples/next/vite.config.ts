import next from "next/vite";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
  plugins: [
    validateImportPlugin({
      "client-only": { ok: true },
      "server-only": {
        ok: false,
        message: `'server-only' is included in client build`,
      },
    }),
    next({
      plugins: [
        validateImportPlugin({
          "client-only": {
            ok: false,
            message: `'client-only' is included in client build`,
          },
          "server-only": { ok: true },
        }),
      ],
    }),
  ],
});

function validateImportPlugin(
  entries: Record<string, { ok: true } | { ok: false; message: string }>,
): Plugin {
  return {
    name: validateImportPlugin.name,
    enforce: "pre",
    resolveId(source, importer, options) {
      const entry = entries[source];
      if (entry) {
        // skip validation during optimizeDeps scan since for now
        // we want to allow going through server/client boundary loosely.
        if (entry.ok || ("scan" in options && options.scan)) {
          return "\0virtual:validate-import";
        }
        throw new Error(
          entry.message + ` (importer: ${importer ?? "unknown"})`,
        );
      }
    },
    load(id, _options) {
      if (id === "\0virtual:validate-import") {
        return "export {}";
      }
    },
  };
}
