#!/bin/bash
set -eu -o pipefail

rm -rf dist/nitro
mkdir -p dist/nitro/routes

cp -r dist/client dist/nitro/public
rm -rf dist/nitro/public/{index.html,.vite}

cp -r misc/nitro/{nitro.config.ts,routes} dist/nitro
