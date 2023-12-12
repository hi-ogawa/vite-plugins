#!/bin/bash
set -eu -o pipefail

npx esbuild ./src/demo.ts \
  "--outfile=./dist/demo.js" \
  --metafile=dist/esbuild-metafile.json \
  --alias:node:fs=./src/polyfills/node-fs.ts \
  --alias:node:module=./src/polyfills/node-module.ts \
  --alias:node:path=./src/polyfills/node-path.ts \
  --alias:node:url=./src/polyfills/node-url.ts \
  --alias:node:vm=./src/polyfills/node-vm.ts \
  --define:process.platform='"linux"' \
  --define:process.env='{}' \
  --define:import='{}' \
  --bundle --format=esm --platform=browser
