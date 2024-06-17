#!/bin/bash
set -eu -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp config.json .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r ../../dist/client/. .vercel/output/static

# functions
mkdir -p .vercel/output/functions/index.func
cp .vc-config.json .vercel/output/functions/index.func/.vc-config.json
npx esbuild ../../dist/server/index.js \
  --outfile=.vercel/output/functions/index.func/index.js \
  --metafile=dist/esbuild-metafile.json \
  --log-override:ignored-bare-import=silent \
  --define:process.env.NODE_ENV='"production"' \
  --bundle \
  --format=esm \
  --platform=browser
