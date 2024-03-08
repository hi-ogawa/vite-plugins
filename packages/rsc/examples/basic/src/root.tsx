import fs from "node:fs";
import { Counter } from "./components/counter";

export async function Root() {
  return (
    <html>
      <head>
        <title>rsc-experiment</title>
        <script src="/@vite/client" type="module" />
      </head>
      <body>
        <h4>Hello RSC</h4>
        <div>
          <pre>{await fs.promises.readFile("./README.md", "utf-8")}</pre>
        </div>
        <div>
          <h4>Client component</h4>
          <Counter />
        </div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
