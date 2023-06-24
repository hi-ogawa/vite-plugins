#!/bin/bash
set -eu -o pipefail

# https://vercel.com/docs/build-output-api/v3/primitives#edge-functions

# .vercel/
#   project.json
#   output/
#     config.json
#     static/              = dist/client
#     functions/
#       index.func/
#         .vc-config.json
#         index.js         = dist/server/index.js (bundled)

# clean
rm -rf .vercel/output
mkdir -p .vercel/output/functions/index.func

# config.json
cp misc/vercel/config.json .vercel/output/config.json

# static
cp -r dist/client .vercel/output/static

# serverless
npx esbuild dist/server/index.js --outfile=.vercel/output/functions/index.func/index.js --bundle --platform=neutral
cp misc/vercel/.vc-config.json .vercel/output/functions/index.func/.vc-config.json
