#!/bin/bash
set -eu -o pipefail

# .vercel/
#   project.json
#   output/
#     config.json
#     static/              = build/client
#     functions/
#       index.func/
#         .vc-config.json
#         index.mjs         = app/adapters/vercel-serverless.ts

cd "$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp config.json .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r ../../dist/client/. .vercel/output/static
rm -rf .vercel/output/static/index.html

# functions
mkdir -p .vercel/output/functions/index.func
cp .vc-config.json .vercel/output/functions/index.func/.vc-config.json

# NOTE: silence `ignored-bare-import` for
# https://rollupjs.org/configuration-options/#output-hoisttransitiveimports
# https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
# https://github.com/evanw/esbuild/issues/2334

npx esbuild ../../dist/server/index.js \
  --outfile=.vercel/output/functions/index.func/index.js \
  --metafile=dist/esbuild-metafile.json \
  --log-override:ignored-bare-import=silent \
  --define:process.env.NODE_ENV='"production"' \
  --bundle \
  --minify \
  --format=esm \
  --platform=browser
