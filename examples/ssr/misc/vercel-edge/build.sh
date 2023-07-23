#!/bin/bash
set -eu -o pipefail

# .vercel/
#   project.json
#   output/
#     config.json
#     static/              = dist/client
#     functions/
#       index.func/
#         .vc-config.json
#         index.js         = dist/server/index.mjs (bundled)

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp misc/vercel-edge/config.json .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r dist/client/. .vercel/output/static
rm .vercel/output/static/{index.html,manifest.json}

# functions
mkdir -p .vercel/output/functions/index.func
cp misc/vercel-edge/.vc-config.json .vercel/output/functions/index.func/.vc-config.json
npx esbuild dist/server/index.mjs --outfile=.vercel/output/functions/index.func/index.js --bundle --minify --format=esm --platform=browser --metafile=dist/server/esbuild-metafile.json
