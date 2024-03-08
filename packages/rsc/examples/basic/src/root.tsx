import fs from "node:fs";
import { ClientCounter } from "./components/counter";

export async function Root() {
  return (
    <html>
      <head>
        <script src="/@vite/client" type="module" />
        <script
          dangerouslySetInnerHTML={{
            // TODO: what's this
            __html: /* js*/ `
              Object.assign(globalThis, {
                __webpack_require__: () => {}
              })
            `,
          }}
        ></script>
      </head>
      <body>
        <div>Hello RSC</div>
        <div>
          <pre>{await fs.promises.readFile("./package.json", "utf-8")}</pre>
        </div>
        <div>
          <ClientCounter />
        </div>
        {/* <script src="/src/entry-client.tsx" type="module" /> */}
      </body>
    </html>
  );
}
