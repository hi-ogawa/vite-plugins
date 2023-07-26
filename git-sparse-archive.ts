import { exec } from "node:child_process";
import { promisify } from "node:util";
import { zip } from "@hiogawa/utils";

// usage
//   node -r esbuild-register git-sparse-archive.ts

const execPromise = promisify(exec);

async function $(strings: TemplateStringsArray, ...params: string[]) {
  const command = [zip(strings, params), strings.at(-1)].flat(2).join("");
  console.log("$", command);
  // TODO: get stderr also when process failed
  const result = await execPromise(command);
  if (result.stderr) {
    console.error(result.stderr);
  }
  return result.stdout;
}

async function main() {
  const gitUrl = "https://github.com/hi-ogawa/vite-plugins.git";
  const branch = "feat-templates";
  const directory = "examples/ssr";

  // https://stackoverflow.com/a/60729017

  const tmpDir = ".tmp";
  await $`rm -rf ${tmpDir}`;
  await $`git clone --sparse --no-checkout --depth 1 --branch ${branch} ${gitUrl} ${tmpDir}`;
  await $`git -C ${tmpDir} sparse-checkout add ${directory}`;
  await $`git -C ${tmpDir} checkout`;
  await $`tar -C ${tmpDir}/${directory} -cf test.tar .`;
  // tar -xvf test.tar --one-top-level=my-project-name
}

// curl -sSfL https://git-sparse-archive-hiro18181.vercel.app/gh/hi-ogawa/vite-plugins/tree/feat-templates/examples/ssr | tar -xvf - --one-top-level=my-project
// wget https://git-sparse-archive-hiro18181.vercel.app/gh/hi-ogawa/vite-plugins/tree/feat-templates/examples/ssr?download=1

// node -r esbuild-register git-sparse-archive.ts https://github.com/hi-ogawa/vite-plugins/tree/feat-templates/examples/ssr

// https://github.com/hi-ogawa/vite-plugins/tree/feat-templates/examples/ssr
function parseGithubUrl(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repo, type, ref, ...restParts] = parts;
  return {
    owner,
    repo,
    type,
    ref,
    path: restParts.join("/"),
  };
}

main();
