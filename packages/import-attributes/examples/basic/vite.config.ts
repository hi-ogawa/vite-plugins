import { readFileSync } from "fs";
import importAttributes, {
  // getImportAttributesFromId,
  type importAttributesMeta,
} from "@hiogawa/vite-plugin-import-attributes";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    importAttributes(),
    {
      name: "import-bytes",
      load(id) {
        const info = this.getModuleInfo(id);
        if (info) {
          info.attributes;
          // info.rawId;
        }
        const meta: importAttributesMeta =
          this.getModuleInfo(id)?.meta["vite-plugin-import-attributes"];
        if (id.includes("bytes")) {
          console.log("[load]", { id, meta }, this.getModuleInfo(id));
        }
        if (!meta) return;
        const { rawId, attributes } = meta;
        if (attributes["type"] === "bytes") {
          // console.log(`<attributes["type"] === "bytes">`, {
          //   id,
          //   rawId,
          //   attributes,
          //   moduleInfo: this.getModuleInfo(id),
          // });
          const data = readFileSync(rawId);
          const base64 = data.toString("base64");
          return `export default (${base64ToBytes.toString()}(${JSON.stringify(base64)}));`;
        }
      },
    },
  ],
}));

function base64ToBytes(str: string): Uint8Array {
  const binaryString = atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
