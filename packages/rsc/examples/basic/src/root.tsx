import fs from "node:fs";

export async function Root() {
  return (
    <html>
      <head>
        <script src="/@vite/client" type="module" />
        <script
          dangerouslySetInnerHTML={{
            // TODO: what's this
            __html: /* js*/ `
              self.__webpack_require__ = () => {};
            `,
          }}
        ></script>
      </head>
      <body>
        <div>Hello RSC</div>
        <div>
          <pre>{await fs.promises.readFile("./package.json", "utf-8")}</pre>
        </div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
