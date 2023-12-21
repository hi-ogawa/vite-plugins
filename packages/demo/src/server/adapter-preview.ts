// TODO: remove

import process from "node:process";
import express from "express";
import middleware from "./adapter-node";

function main() {
  const app = express();
  app.use("/assets", express.static("./dist/client/assets"));
  app.use(middleware);

  const port = process.env["PORT"] ?? 3000;
  app.listen(port, () => {
    console.log(`* server started at http://localhost:${port}`);
  });
}

main();
