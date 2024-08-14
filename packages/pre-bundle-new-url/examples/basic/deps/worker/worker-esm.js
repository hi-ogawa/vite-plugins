import { workerDep } from "./worker-dep.js";

self.onmessage = async () => {
  const { workerDepDynamic } = await import("./worker-dep-dynamic.js");
  const data = {
    href: self.location.href,
    viteSvg: new URL("./vite.svg", import.meta.url).href,
    workerDep,
    workerDepDynamic,
  };
  self.postMessage(data);
};
