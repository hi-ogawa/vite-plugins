import { workerDep } from "./worker-dep.js";

self.onmessage = async () => {
  const { workerDepDynamic } = await import("./worker-dep-dynamic.js");
  const data = {
    "self.location.href": self.location.href,
    workerDep,
    workerDepDynamic,
    viteSvg: new URL("./vite.svg", import.meta.url),
  };
  self.postMessage(JSON.stringify(data, null, 2));
};
