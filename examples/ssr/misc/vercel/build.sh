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

this_dir="$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp "$this_dir/config.json" .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r dist/client/. .vercel/output/static
rm .vercel/output/static/{index.html,manifest.json}

# functions
mkdir -p .vercel/output/functions/index.func
cp "$this_dir/.vc-config.json" .vercel/output/functions/index.func/.vc-config.json

# TODO: exclude unused deps
# - react-xxx.development
# - node-fetch-native
npx esbuild dist/server/index.mjs --outfile=.vercel/output/functions/index.func/index.js --bundle --minify --format=cjs --platform=node --metafile=dist/server/esbuild-metafile.json
