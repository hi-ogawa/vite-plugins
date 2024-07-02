import { readFileSync, writeFileSync } from "fs";

export function createEditor(filepath: string) {
  const init = readFileSync(filepath, "utf-8");
  return {
    edit(editFn: (data: string) => string) {
      const next = editFn(init);
      writeFileSync(filepath, next);
    },
    [Symbol.dispose]() {
      writeFileSync(filepath, init);
    },
  };
}
