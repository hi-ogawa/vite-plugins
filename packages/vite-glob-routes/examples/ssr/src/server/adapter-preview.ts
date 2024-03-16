import process from "node:process";
import express from "express";
import adapterNode from "./adapter-node";

function main() {
  const app = express();
  app.use("/", express.static("./dist/client", { index: false }));
  app.use(adapterNode);

  const port = process.env["PORT"] ?? 3000;
  app.listen(port, () => {
    console.log(`* server started at http://localhost:${port}`);
  });
}

main();
