import * as testDepEmscripten from "test-dep-emscripten";
import * as testDepImage from "test-dep-image";
import * as testDepWorker from "test-dep-worker";
import * as testDepWorkerWasm from "test-dep-worker-wasm";

async function main() {
  render(
    "image1",
    `\
<h4>new URL("./vite.svg", import.meta.url)</h4>
<a href="${testDepImage.image1}">${testDepImage.image1}</a><br/>
<img width="40" src="${testDepImage.image1}" />
`,
  );

  render(
    "image2",
    `\
<h4>new URL("vite.svg", import.meta.url)</h4>
<a href="${testDepImage.image2}">${testDepImage.image2}</a><br/>
<img width="40" src="${testDepImage.image2}" />
`,
  );

  testDepWorker.startWorker((e) => {
    render(
      "worker-classic",
      `\
<h4>worker-classic</h4>
<a href="${e.data.href}">${e.data.href}</a><br/>
<pre>${JSON.stringify(e.data, null, 2)}</pre>
`,
    );
  });

  testDepWorker.startWorkerEsm((e) => {
    render(
      "worker-esm",
      `\
<h4>worker-esm</h4>
<a href="${e.data.href}">${e.data.href}</a><br/>
<a href="${e.data.viteSvg}">${e.data.viteSvg}</a><br/>
<pre>${JSON.stringify(e.data, null, 2)}</pre>
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

  // manual worker integration for emscripten esm
  testDepEmscripten.startWorker((e) => {
    render(
      "worker-emscripten-esm",
      `\
<h4>worker-emscripten-esm</h4>
<pre>${e.data}</pre>
`,
    );
  });
}

function render(id, innerHTML) {
  document.getElementById(id).innerHTML = innerHTML;
}

main();
