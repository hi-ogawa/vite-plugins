// usage
// node -r esbuild-register ./examples/gh-download.ts

async function main() {
  const owner = "hi-ogawa";
  const repo = "vite-plugins";
  const ref = "feat-templates";
  const prefix = "examples/ssr/";

  // https://github.com/unjs/ungh
  // https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1
  console.log("* downloading files list...");
  const res = await fetch(
    `https://ungh.cc/repos/${owner}/${repo}/files/${ref}`
  );
  const resJson = await res.json();
  const files = resJson.files;

  const filesData: any[] = [];
  for (const file of files) {
    if (file.path.startsWith(prefix)) {
      console.log(`* downloading '${file.path}'`);
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${file.path}`
      );
      const contents = await res.text();
      filesData.push({ file, contents });
    }
  }
  console.log(filesData);
}

main();
