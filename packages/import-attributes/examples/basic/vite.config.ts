import importAttributes, {
  getImportAttributesFromId,
} from "@hiogawa/vite-plugin-import-attributes";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    importAttributes(),
    {
      name: "import-bytes",
      transform(code, id, _options) {
        const { attributes } = getImportAttributesFromId(id);
        if (attributes["type"] === "bytes") {
          const base64 = Buffer.from(code, "utf-8").toString("base64");
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
