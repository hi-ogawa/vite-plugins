#!/bin/bash
set -eu -o pipefail

# .vercel/
#   project.json
#   output/
#     config.json
#     static/              = dist/client

this_dir="$(dirname "${BASH_SOURCE[0]}")"

# clean
rm -rf .vercel/output
mkdir -p .vercel/output

# config.json
cp "$this_dir/config.json" .vercel/output/config.json

# static
mkdir -p .vercel/output/static
cp -r dist/client/. .vercel/output/static
