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
#         index.js         = dist/server/index.mjs (bundled)

# clean
rm -rf .vercel/output
mkdir -p .vercel/output/static
mkdir -p .vercel/output/functions/index.func

# config.json
cp misc/vercel/config.json .vercel/output/config.json

# static
cp -r dist/client/assets .vercel/output/static/assets

# serverless
npx esbuild dist/server/index.mjs --outfile=.vercel/output/functions/index.func/index.js --bundle --minify --format=esm --platform=browser --metafile=dist/server/esbuild-metafile.json
cp misc/vercel/.vc-config.json .vercel/output/functions/index.func/.vc-config.json
