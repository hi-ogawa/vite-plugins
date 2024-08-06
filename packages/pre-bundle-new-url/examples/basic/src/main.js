import * as testDepImage from "test-dep-image";
import * as testDepWorker from "test-dep-worker";

async function main() {
  document.createDocumentFragment;
  document.body.appendChild(
    Object.assign(document.createElement("div"), {
      innerHTML: `
        <pre>new URL("./vite.svg", import.meta.url)</pre>
        <img width="40" src="${testDepImage.image1}" />
      `,
    }),
  );
  document.body.appendChild(
    Object.assign(document.createElement("div"), {
      innerHTML: `
        <pre>new URL("vite.svg", import.meta.url)</pre>
        <img width="40" src="${testDepImage.image2}" />
      `,
    }),
  );

  // worker
  testDepWorker.startWorker((e) => {
    const el = document.createElement("pre");
    el.textContent = "worker = " + e.data;
    document.body.appendChild(el);
  });
}

main();
