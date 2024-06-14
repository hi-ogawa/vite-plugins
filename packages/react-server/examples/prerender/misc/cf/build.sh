#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../dist/client/. dist/client

# post process assets
node ./build.mjs

# server
npx esbuild ../../dist/server/index.js \
  --outfile=dist/client/_worker.js \
  --metafile=dist/esbuild-metafile.json \
  --define:process.env.NODE_ENV='"production"' \
  --log-override:ignored-bare-import=silent \
  --bundle \
  --format=esm \
  --platform=browser
