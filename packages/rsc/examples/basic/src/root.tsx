import fs from "node:fs";
import { Counter } from "./components/counter";
import { Header } from "./components/header";

// TODO: full <html> render?
export async function Root() {
  return (
    <div>
      <Header />
      <div>
        <pre>{await fs.promises.readFile("./README.md", "utf-8")}</pre>
      </div>
      <div>
        <h4>Client component</h4>
        <Counter defaultValue={1234} />
      </div>
    </div>
  );
}
