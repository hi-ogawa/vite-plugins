import * as testDepImage from "test-dep-image";
import * as testDepWorker from "test-dep-worker";
import * as testDepWorkerWasm from "test-dep-worker-wasm";

async function main() {
  render(
    "image1",
    `\
<h4>new URL("./vite.svg", import.meta.url)</h4>
<img width="40" src="${testDepImage.image1}" />
`,
  );

  render(
    "image2",
    `\
<h4>new URL("vite.svg", import.meta.url)</h4>
<img width="40" src="${testDepImage.image2}" />
`,
  );

  testDepWorker.startWorker((e) => {
    render(
      "worker-classic",
      `\
<h4>worker-classic</h4>
<pre>${e.data}</pre>
`,
    );
  });

  testDepWorker.startWorkerEsm((e) => {
    render(
      "worker-esm",
      `\
<h4>worker-esm</h4>
<pre>worker-esm = ${e.data}</pre>
`,
    );
  });

  // worker with wasm
  testDepWorkerWasm.startWorker((e) => {
    render(
      "worker-wasm",
      `\
<h4>worker-wasm</h4>
<pre>worker-wasm = ${e.data.href}\n${JSON.stringify(e.data.oxc).slice(0, 100)}...</pre>
`,
    );
  });
}
function render(id, innerHTML) {
  document.getElementById(id).innerHTML = innerHTML;
}

main();
