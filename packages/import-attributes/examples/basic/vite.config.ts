import { readFileSync } from "fs";
import importAttributes, {
  parseImportAttributes,
} from "@hiogawa/vite-plugin-import-attributes";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    importAttributes(),
    {
      name: "import-bytes",
      load(id) {
        const { rawId, attributes } = parseImportAttributes(id);
        if (attributes["type"] === "bytes") {
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
