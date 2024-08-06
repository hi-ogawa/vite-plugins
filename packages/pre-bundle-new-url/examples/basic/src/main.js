import * as testDepImage from "test-dep-image";
import * as testDepWorker from "test-dep-worker";

async function main() {
  render(`
    <pre>new URL("./vite.svg", import.meta.url)</pre>
    <img width="40" src="${testDepImage.image1}" />
  `);

  render(`
    <pre>new URL("vite.svg", import.meta.url)</pre>
    <img width="40" src="${testDepImage.image2}" />
  `);

  testDepWorker.startWorker((e) => {
    render(`<pre>worker-classic = ${e.data}</pre>`);
  });

  testDepWorker.startWorkerEsm((e) => {
    render(`<pre>worker-esm = ${e.data}</pre>`);
  });
}

function render(innerHTML) {
  const el = document.createElement("div");
  el.innerHTML = innerHTML;
  document.body.appendChild(el);
}

main();
