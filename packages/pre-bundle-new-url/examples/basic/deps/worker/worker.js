import { workerDep } from "./worker-dep.js";

self.onmessage = () => {
  console.log(workerDep);
  self.postMessage(self.location.href);
};
