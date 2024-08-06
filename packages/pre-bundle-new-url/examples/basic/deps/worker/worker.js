import { workerDep } from "./worker-dep.js";

self.onmessage = async () => {
  const { workerDepDynamic } = await import("./worker-dep-dynamic.js");
  const data = {
    "self.location.href": self.location.href,
    workerDep,
    workerDepDynamic,
  };
  self.postMessage(JSON.stringify(data, null, 2));
};
