import fs from "node:fs";
import { Counter } from "./components/counter";
import { Header } from "./components/header";

export async function Root() {
  return (
    <html>
      <head>
        <title>rsc-experiment</title>
        <script src="/@vite/client" type="module" />
      </head>
      <body>
        <Header />
        <div>
          <pre>{await fs.promises.readFile("./README.md", "utf-8")}</pre>
        </div>
        <div>
          <h4>Client component</h4>
          <Counter defaultValue={1234} />
        </div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
