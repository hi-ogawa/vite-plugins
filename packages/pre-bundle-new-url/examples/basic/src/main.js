import * as testDepImage from "test-dep-image";
import * as testDepWorker from "test-dep-worker";

async function main() {
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
    document.body.appendChild(
      Object.assign(document.createElement("div"), {
        innerHTML: `
          <pre>worker = ${e.data}</pre>
        `,
      }),
    );
  });
}

main();
