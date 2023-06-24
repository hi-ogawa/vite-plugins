import express from "express";
import middleware from "./adapter-connect";

function main() {
  const app = express();
  app.use("/assets", express.static("./dist/client/assets"));
  app.use(middleware);
  app.listen(3000, () => {
    console.log("* server started at http://localhost:3000");
  });
}

main();
