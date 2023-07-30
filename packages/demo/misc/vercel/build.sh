#!/bin/bash
set -eu -o pipefail

# https://vercel.com/docs/build-output-api/v3/primitives#edge-functions

# .vercel/
#   project.json
#   output/
#     config.json
#     static/
#       assets/            = dist/client/assets
#     functions/
#       index.func/
#         .vc-config.json
#         index.js         = bundled dist/server/index.js or mjs

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp misc/vercel/config.json .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r dist/client/assets .vercel/output/static/assets

# serverless
mkdir -p .vercel/output/functions/index.func
npx esbuild dist/server/index.js \
  --outfile=.vercel/output/functions/index.func/index.js \
  --bundle --minify --format=esm --platform=browser \
  --metafile=dist/server/esbuild-metafile.json \
  --external:node:async_hooks \
  --external:node:buffer
cp misc/vercel/.vc-config.json .vercel/output/functions/index.func/.vc-config.json
