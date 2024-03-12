#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf dist
mkdir -p dist/server dist/client

# static
cp -r ../../dist/client/. dist/client
rm -rf dist/client/index.html

# server (bundle by ourselve instead of relying on wrangler)
npx esbuild ../../dist/server/index.js \
  --outfile=dist/server/index.js \
  --metafile=dist/esbuild-metafile.json \
  --define:process.env.NODE_ENV='"production"' \
  --bundle \
  --minify \
  --format=esm \
  --platform=browser
