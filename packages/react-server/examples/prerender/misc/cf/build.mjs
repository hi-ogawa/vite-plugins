import fs from "node:fs";
import path from "node:path";

async function main() {
  const distDir = path.join(import.meta.dirname, "dist/client");
  const files = await fs.promises.readdir(distDir, {
    recursive: true,
    withFileTypes: true,
  });
  const prerendered = [];
  for (const f of files) {
    if (f.isFile() && f.name === "index.html") {
      const pathname = f.path.slice(distDir.length) || "/";
      prerendered.push(pathname);

      // rename /hello/index.html -> /hello.html
      // TODO: probably the default prerender output should follow this
      if (f.path !== distDir) {
        await fs.promises.rename(
          path.join(f.path, "index.html"),
          f.path + ".html",
        );
      }
    }
  }
  const exclude = [
    "/favicon.ico",
    "/assets/*",
    ...prerendered,
    ...prerendered.map((p) => path.join(p, "__f.data")),
  ];
  const routesJson = {
    version: 1,
    include: ["/*"],
    exclude,
  };

  await fs.promises.mkdir(distDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(distDir, "_routes.json"),
    JSON.stringify(routesJson, null, 2),
  );

  const headers = `
/favicon.ico
  Cache-Control: public, max-age=3600, s-maxage=3600
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
  await fs.promises.writeFile(path.join(distDir, "_headers"), headers);
}

main();
