import type MagicString from "magic-string";

function inlineSourceMap(output: MagicString) {
  const code = output.toString();
  const map = output.generateMap({ includeContent: true, hires: "boundary" });
  const encoded = Buffer.from(JSON.stringify(map), "utf-8").toString("base64");
  return `${code}\n\n//# ${"s"}ourceMappingURL=data:application/json;charset=utf-8;base64,${encoded}\n`;
}
