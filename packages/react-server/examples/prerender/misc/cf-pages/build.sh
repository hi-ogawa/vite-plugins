#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../dist/client/. dist/client
cp _headers _routes.json dist/client

# server
npx esbuild ../../dist/server/index.js \
  --outfile=dist/client/_worker.js \
  --metafile=dist/esbuild-metafile.json \
  --define:process.env.NODE_ENV='"production"' \
  --log-override:ignored-bare-import=silent \
  --bundle \
  --minify \
  --format=esm \
  --platform=browser
