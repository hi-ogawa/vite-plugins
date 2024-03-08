import fs from "node:fs";
import { CounterReference } from "./components/counter-reference";

export async function Root() {
  return (
    <html>
      <head>
        <title>rsc-experiment</title>
        <script src="/@vite/client" type="module" />
      </head>
      <body>
        <div>Hello RSC</div>
        <div>
          <pre>{await fs.promises.readFile("./README.md", "utf-8")}</pre>
        </div>
        <div>
          <CounterReference />
        </div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
