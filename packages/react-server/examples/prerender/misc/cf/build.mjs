import fs from "node:fs";
import path from "node:path";

async function main() {
  const distDir = path.join(import.meta.dirname, "dist/client");
  const entries = JSON.parse(
    fs.readFileSync(path.join(distDir, "__prerender.json"), "utf-8"),
  );
  const exclude = [
    "/favicon.ico",
    "/assets/*",
    ...entries.flatMap((e) => [e.route, e.data]),
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
