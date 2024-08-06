import initOxc, { parseSync } from "@oxc-parser/wasm";

self.onmessage = async () => {
  await initOxc();
  const result = parseSync("() => 123");

  self.postMessage({
    href: self.location.href,
    oxc: result.program,
  });
};
